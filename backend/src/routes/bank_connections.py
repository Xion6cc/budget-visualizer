from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
import requests
import json
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import sys

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from data.bank_transaction_processor import BankTransactionProcessor

router = APIRouter(prefix="/banks", tags=["banks"])

CONFIG_PATH = Path(__file__).parent.parent.parent.parent / "config" / "bank_connections.json"

REDIRECT_URI = "http://localhost:8000/banks/callback"


def get_urls(config: dict) -> tuple[str, str]:
    """Return (auth_url, api_url) — sandbox or live based on client_id prefix."""
    client_id = config["truelayer"]["client_id"]
    if client_id.startswith("sandbox-"):
        return "https://auth.truelayer-sandbox.com", "https://api.truelayer-sandbox.com"
    return "https://auth.truelayer.com", "https://api.truelayer.com"

# Predefined providers the user can connect
PROVIDERS = {
    "Lloyds": {
        "display_name": "Lloyds Bank",
        "truelayer_providers": "uk-ob-lloyds",
        "scope": "accounts+transactions+cards+offline_access",
    },
    "Amex_UK": {
        "display_name": "American Express UK",
        "truelayer_providers": "uk-oauth-amex",
        "scope": "accounts+transactions+cards+offline_access",
    },
    "Starling": {
        "display_name": "Starling Bank",
        "truelayer_providers": "uk-ob-starling",
        "scope": "accounts+transactions+offline_access",
    },
}


def load_config() -> dict:
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_config(config: dict):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=4)


def get_access_token(refresh_token: str, config: dict) -> str:
    auth_url, _ = get_urls(config)
    resp = requests.post(
        f"{auth_url}/connect/token",
        data={
            "grant_type": "refresh_token",
            "client_id": config["truelayer"]["client_id"],
            "client_secret": config["truelayer"]["client_secret"],
            "refresh_token": refresh_token,
        },
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


@router.get("/connections")
async def list_connections():
    """List all known providers (TrueLayer + Plaid) with their connection status."""
    config = load_config()
    connections = config.get("connections", {})
    now = datetime.utcnow()
    result = []

    # TrueLayer providers
    for provider_name, provider_info in PROVIDERS.items():
        conn = connections.get(provider_name)
        if conn:
            expires_at = datetime.fromisoformat(conn["expires_at"])
            days_left = (expires_at - now).days
            if days_left <= 0:
                status = "expired"
            elif days_left <= 14:
                status = "expiring"
            else:
                status = "connected"
            result.append({
                "provider": provider_name,
                "display_name": provider_info["display_name"],
                "status": status,
                "expires_at": conn["expires_at"],
                "days_left": max(0, days_left),
                "account_count": len(conn.get("accounts", [])),
                "source": "truelayer",
            })
        else:
            result.append({
                "provider": provider_name,
                "display_name": provider_info["display_name"],
                "status": "disconnected",
                "expires_at": None,
                "days_left": None,
                "account_count": 0,
                "source": "truelayer",
            })

    # Plaid connections (Plaid tokens don't expire; they stay valid until revoked)
    for item_id, info in config.get("plaid_connections", {}).items():
        result.append({
            "provider": f"plaid:{item_id}",
            "display_name": info["institution_name"],
            "status": "connected",
            "expires_at": None,
            "days_left": None,
            "account_count": len(info.get("accounts", [])),
            "source": "plaid",
        })

    return result


@router.get("/auth-url")
async def get_auth_url(provider: str):
    """Generate TrueLayer OAuth URL for the given provider."""
    if provider not in PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    config = load_config()
    client_id = config["truelayer"]["client_id"]
    if not client_id:
        raise HTTPException(
            status_code=400,
            detail="TrueLayer client_id not set. Add it to config/bank_connections.json.",
        )

    auth_url, _ = get_urls(config)
    provider_info = PROVIDERS[provider]
    scope = provider_info.get("scope", "accounts+transactions+offline_access")
    url = (
        f"{auth_url}/"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={scope}"
        f"&providers={provider_info['truelayer_providers']}"
        f"&state={provider}"
    )
    return {"url": url}


@router.get("/callback")
async def oauth_callback(code: str, state: str):
    """Handle TrueLayer OAuth redirect."""
    provider = state
    if provider not in PROVIDERS:
        return HTMLResponse("<html><body>Error: unknown provider state</body></html>", status_code=400)

    config = load_config()
    auth_url, api_url = get_urls(config)

    # Exchange code for tokens
    resp = requests.post(
        f"{auth_url}/connect/token",
        data={
            "grant_type": "authorization_code",
            "client_id": config["truelayer"]["client_id"],
            "client_secret": config["truelayer"]["client_secret"],
            "redirect_uri": REDIRECT_URI,
            "code": code,
        },
    )
    if not resp.ok:
        return HTMLResponse(
            f"<html><body>Token exchange failed: {resp.text}</body></html>",
            status_code=400,
        )

    token_data = resp.json()
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]
    expires_at = (datetime.utcnow() + timedelta(days=90)).isoformat()

    # Discover accounts from both endpoints (some banks have both current accounts and credit cards)
    accounts = []
    for endpoint in ["/data/v1/accounts", "/data/v1/cards"]:
        try:
            ar = requests.get(
                f"{api_url}{endpoint}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if ar.ok:
                for a in ar.json().get("results", []):
                    account_id = a.get("account_id") or a.get("card_id", "")
                    display_name = a.get("display_name") or a.get("name") or account_id
                    accounts.append({"account_id": account_id, "display_name": display_name})
        except Exception:
            continue

    # Persist
    if "connections" not in config:
        config["connections"] = {}
    config["connections"][provider] = {
        "refresh_token": refresh_token,
        "expires_at": expires_at,
        "accounts": accounts,
    }
    save_config(config)

    return HTMLResponse("""
<html><head><title>Connected</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
  <h2>Connected successfully!</h2>
  <p>You can close this tab and return to the app.</p>
  <script>setTimeout(()=>window.close(),2000);</script>
</body></html>
""")


@router.delete("/connections/{provider}")
async def disconnect_bank(provider: str):
    """Remove a bank connection."""
    if provider not in PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    config = load_config()
    config.get("connections", {}).pop(provider, None)
    save_config(config)
    return {"success": True}


class FetchRequest(BaseModel):
    from_date: Optional[str] = None   # YYYY-MM-DD; defaults to first day of last month
    to_date: Optional[str] = None     # YYYY-MM-DD; defaults to last day of last month
    providers: Optional[List[str]] = None  # None = all connected banks


def _build_keyword_index(processor) -> List[tuple]:
    """Pre-lowered (category, keyword) pairs to avoid repeated .lower() per transaction."""
    return [
        (cat, kw.lower())
        for cat, mapping in processor.category_mapping.items()
        for kw in mapping.get("contains", [])
    ]


def _auto_categorize(description: str, keyword_index: List[tuple]) -> Optional[str]:
    desc_lower = description.lower()
    for cat, kw in keyword_index:
        if kw in desc_lower:
            return cat
    return None


@router.post("/fetch")
async def fetch_transactions(request: FetchRequest):
    """Fetch transactions from connected banks (TrueLayer + Plaid), auto-categorize, store in import state."""
    config = load_config()

    # Default date range: first → last day of previous calendar month
    now = datetime.utcnow()
    first_of_this_month = now.replace(day=1)
    last_of_prev_month = first_of_this_month - timedelta(days=1)
    first_of_prev_month = last_of_prev_month.replace(day=1)

    from_date = request.from_date or first_of_prev_month.strftime("%Y-%m-%d")
    to_date = request.to_date or last_of_prev_month.strftime("%Y-%m-%d")

    # Split requested providers into TrueLayer vs Plaid
    requested = request.providers  # None means fetch all
    if requested is not None:
        tl_providers = [p for p in requested if not p.startswith("plaid:")]
        plaid_item_ids = [p[len("plaid:"):] for p in requested if p.startswith("plaid:")]
    else:
        tl_providers = list(config.get("connections", {}).keys())
        plaid_item_ids = list(config.get("plaid_connections", {}).keys())

    config_dir = Path(__file__).parent.parent.parent.parent / "config"
    processor = BankTransactionProcessor(config_dir=str(config_dir))
    keyword_index = _build_keyword_index(processor)
    all_transactions = []

    # ── TrueLayer ────────────────────────────────────────────────────────────
    tl_connections = {k: v for k, v in config.get("connections", {}).items() if k in tl_providers}
    _, api_url = get_urls(config)

    for provider_name, conn in tl_connections.items():
        try:
            access_token = get_access_token(conn["refresh_token"], config)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Token refresh failed for {provider_name}: {e}. Re-connect this bank.",
            )

        provider_display = PROVIDERS[provider_name]["display_name"]

        for account in conn.get("accounts", []):
            account_id = account["account_id"]
            account_display = account.get("display_name", account_id)

            transactions_raw = []
            for tx_endpoint in [
                f"/data/v1/accounts/{account_id}/transactions",
                f"/data/v1/cards/{account_id}/transactions",
            ]:
                try:
                    resp = requests.get(
                        f"{api_url}{tx_endpoint}",
                        headers={"Authorization": f"Bearer {access_token}"},
                        params={"from": from_date, "to": to_date},
                    )
                    if resp.ok:
                        results = resp.json().get("results", [])
                        if results:
                            transactions_raw = results
                            break
                except Exception:
                    continue

            for t in transactions_raw:
                if t.get("transaction_type") == "CREDIT":
                    continue
                description = t.get("description") or t.get("merchant_name", "")
                amount = abs(float(t.get("amount", 0)))
                date_str = pd.to_datetime(t["timestamp"]).strftime("%Y-%m-%d")
                currency = t.get("currency", "GBP")
                card = f"{provider_display} - {account_display}"
                all_transactions.append({
                    "Date": date_str,
                    "Amount": amount,
                    "Description": description,
                    "Category": _auto_categorize(description, keyword_index),
                    "Currency": currency,
                    "Card": card,
                    "Bank": None,
                })

    # ── Plaid ────────────────────────────────────────────────────────────────
    from .plaid_connections import plaid_post

    plaid_conns = {k: v for k, v in config.get("plaid_connections", {}).items() if k in plaid_item_ids}

    for _, info in plaid_conns.items():
        institution = info["institution_name"]
        try:
            tx_data = plaid_post("/transactions/get", {
                "access_token": info["access_token"],
                "start_date": from_date,
                "end_date": to_date,
                "options": {"count": 500, "offset": 0},
            }, config)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Plaid fetch failed for {institution}: {e}")

        for t in tx_data.get("transactions", []):
            # Plaid: positive amount = debit (money out), negative = credit (money in)
            if t.get("amount", 0) <= 0:
                continue
            description = t.get("merchant_name") or t.get("name", "")
            amount = float(t["amount"])
            date_str = t["date"]  # Already YYYY-MM-DD
            currency = t.get("iso_currency_code", "USD")
            account_id = t.get("account_id", "")
            account_display = next(
                (a["display_name"] for a in info.get("accounts", []) if a["account_id"] == account_id),
                account_id,
            )
            card = f"{institution} - {account_display}"
            all_transactions.append({
                "Date": date_str,
                "Amount": amount,
                "Description": description,
                "Category": _auto_categorize(description, keyword_index),
                "Currency": currency,
                "Card": card,
                "Bank": None,
            })

    if not all_transactions:
        raise HTTPException(
            status_code=400,
            detail="No banks selected or no debit transactions found in the specified date range.",
        )

    categorized = [t for t in all_transactions if t["Category"] is not None]
    uncategorized = [t for t in all_transactions if t["Category"] is None]
    for idx, t in enumerate(uncategorized):
        t["index"] = idx

    processed_dir = (
        Path(__file__).parent.parent.parent.parent
        / "data"
        / "get_data"
        / "processed_transaction"
    )
    json_files = sorted(processed_dir.glob("expense_*.json"), reverse=True)
    if not json_files:
        raise HTTPException(status_code=404, detail="No existing expense JSON found in processed_transaction/")

    existing_df = pd.read_json(json_files[0], orient="records", lines=True)

    from .import_lab import processing_state

    processing_state["existing_data"] = existing_df.to_dict("records")
    processing_state["new_transactions"] = all_transactions
    processing_state["uncategorized"] = uncategorized
    processing_state["processor"] = processor

    return {
        "total_new": len(all_transactions),
        "auto_categorized": len(categorized),
        "uncategorized": uncategorized,
        "uncategorized_count": len(uncategorized),
        "all_transactions": all_transactions,
    }
