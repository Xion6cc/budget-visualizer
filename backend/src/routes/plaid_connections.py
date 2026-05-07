from fastapi import APIRouter, HTTPException
import requests
import json
from datetime import datetime, timedelta
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/plaid", tags=["plaid"])

CONFIG_PATH = Path(__file__).parent.parent.parent.parent / "config" / "bank_connections.json"


def load_config() -> dict:
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_config(config: dict):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=4)


def get_plaid_base_url(config: dict) -> str:
    env = config.get("plaid", {}).get("environment", "sandbox")
    return "https://production.plaid.com" if env == "production" else "https://sandbox.plaid.com"


def plaid_post(endpoint: str, body: dict, config: dict) -> dict:
    """Make an authenticated Plaid API POST request."""
    plaid_cfg = config.get("plaid", {})
    base_url = get_plaid_base_url(config)
    body["client_id"] = plaid_cfg.get("client_id", "")
    body["secret"] = plaid_cfg.get("secret", "")
    resp = requests.post(
        f"{base_url}{endpoint}",
        json=body,
        headers={"Content-Type": "application/json"},
    )
    if not resp.ok:
        raise HTTPException(status_code=400, detail=f"Plaid error: {resp.json().get('error_message', resp.text)}")
    return resp.json()


def check_plaid_config(config: dict):
    plaid_cfg = config.get("plaid", {})
    if not plaid_cfg.get("client_id") or not plaid_cfg.get("secret"):
        raise HTTPException(
            status_code=400,
            detail="Plaid client_id and secret not configured. Add them to config/bank_connections.json.",
        )


@router.post("/link-token")
async def create_link_token():
    """Create a Plaid Link token so the frontend can open the Link widget."""
    config = load_config()
    check_plaid_config(config)
    data = plaid_post("/link/token/create", {
        "user": {"client_user_id": "budget-user"},
        "client_name": "Budget Visualizer",
        "products": ["transactions"],
        "country_codes": ["US"],
        "language": "en",
    }, config)
    return {"link_token": data["link_token"]}


class ExchangeTokenRequest(BaseModel):
    public_token: str
    institution_name: str
    institution_id: str


@router.post("/exchange-token")
async def exchange_public_token(request: ExchangeTokenRequest):
    """Exchange a Plaid public token (from Link widget) for a permanent access token."""
    config = load_config()
    check_plaid_config(config)

    data = plaid_post("/item/public_token/exchange", {
        "public_token": request.public_token,
    }, config)

    access_token = data["access_token"]
    item_id = data["item_id"]

    # Fetch accounts for this item
    accounts_data = plaid_post("/accounts/get", {
        "access_token": access_token,
    }, config)

    accounts = [
        {
            "account_id": a["account_id"],
            "display_name": a.get("official_name") or a.get("name") or a["account_id"],
            "type": a.get("type", ""),
            "subtype": a.get("subtype", ""),
        }
        for a in accounts_data.get("accounts", [])
    ]

    if "plaid_connections" not in config:
        config["plaid_connections"] = {}

    config["plaid_connections"][item_id] = {
        "access_token": access_token,
        "institution_name": request.institution_name,
        "institution_id": request.institution_id,
        "accounts": accounts,
        "connected_at": datetime.utcnow().isoformat(),
    }
    save_config(config)

    return {
        "success": True,
        "item_id": item_id,
        "institution_name": request.institution_name,
        "account_count": len(accounts),
    }


@router.get("/connections")
async def list_plaid_connections():
    """List all Plaid connections."""
    config = load_config()
    return [
        {
            "item_id": item_id,
            "institution_name": info["institution_name"],
            "account_count": len(info.get("accounts", [])),
            "connected_at": info.get("connected_at"),
        }
        for item_id, info in config.get("plaid_connections", {}).items()
    ]


@router.delete("/connections/{item_id}")
async def disconnect_plaid(item_id: str):
    """Remove a Plaid bank connection."""
    config = load_config()
    plaid_conns = config.get("plaid_connections", {})
    if item_id not in plaid_conns:
        raise HTTPException(status_code=404, detail="Plaid connection not found")

    # Tell Plaid to invalidate the access token
    try:
        plaid_post("/item/remove", {"access_token": plaid_conns[item_id]["access_token"]}, config)
    except Exception:
        pass  # Even if this fails, remove locally

    del plaid_conns[item_id]
    save_config(config)
    return {"success": True}
