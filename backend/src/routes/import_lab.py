from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, Response
from typing import List, Optional
import pandas as pd
import json
import io
import calendar
from pathlib import Path
from pydantic import BaseModel

# Import existing utilities
import sys
sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from data.bank_transaction_processor import BankTransactionProcessor

router = APIRouter(prefix="/import", tags=["import"])

# Store processing state in memory
processing_state = {
    "existing_data": None,
    "new_transactions": None,
    "uncategorized": None,
    "processor": None
}

# Default directories for auto-loading files
STATEMENTS_DIR = Path(__file__).parent.parent.parent.parent / "data" / "get_data" / "statements"
PROCESSED_TRANSACTIONS_DIR = Path(__file__).parent.parent.parent.parent / "data" / "get_data" / "processed_transaction"


class BankConfigSelection(BaseModel):
    filename: str
    bank_config: str


class ProcessRequest(BaseModel):
    existing_json: dict
    bank_selections: List[BankConfigSelection]


class LabelRequest(BaseModel):
    index: int
    category: str
    save_to_mapping: bool = False
    description: Optional[str] = None


class DropRequest(BaseModel):
    index: int


@router.post("/auto-load")
async def auto_load_files():
    """
    Auto-load files from default directories
    Returns list of files for bank config selection
    """
    try:
        # Find latest JSON file from processed_transactions directory
        json_files = sorted(PROCESSED_TRANSACTIONS_DIR.glob("expense_*.json"), reverse=True)
        if not json_files:
            raise HTTPException(status_code=404, detail="No expense JSON files found in processed_transaction directory")

        latest_json = json_files[0]

        # Read existing JSON using pandas (same as notebook: orient='records', lines=True)
        existing_df = pd.read_json(latest_json, orient='records', lines=True)
        existing_data = existing_df.to_dict('records')

        processing_state["existing_data"] = existing_data

        # Find all CSV files from statements directory
        csv_files = list(STATEMENTS_DIR.glob("*.csv"))

        # Store CSV files
        uploaded_files = []
        for csv_path in csv_files:
            with open(csv_path, 'rb') as f:
                content = f.read()
            uploaded_files.append({
                "filename": csv_path.name,
                "content": content,
                "content_type": "text/csv"
            })

        processing_state["uploaded_files"] = uploaded_files

        # Return list of files and available bank configs
        config_path = Path(__file__).parent.parent.parent.parent / "config"
        processor = BankTransactionProcessor(config_dir=str(config_path))
        processing_state["processor"] = processor

        bank_configs = processor.original_config_names

        return {
            "uploaded_files": [f["filename"] for f in uploaded_files],
            "bank_configs": bank_configs,
            "existing_transaction_count": len(existing_data),
            "existing_json_file": latest_json.name
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/process")
async def process_files(
    existing_json: UploadFile = File(...),
    csv_files: List[UploadFile] = File(...),
):
    """
    Step 1: Upload existing JSON and CSV/Excel files
    Returns list of files for bank config selection
    """
    try:
        # Read existing JSON using pandas (same as notebook: orient='records', lines=True)
        existing_content = await existing_json.read()
        existing_df = pd.read_json(io.BytesIO(existing_content), orient='records', lines=True)
        existing_data = existing_df.to_dict('records')

        processing_state["existing_data"] = existing_data

        # Store uploaded CSV/Excel files
        uploaded_files = []
        for file in csv_files:
            content = await file.read()
            uploaded_files.append({
                "filename": file.filename,
                "content": content,
                "content_type": file.content_type
            })

        processing_state["uploaded_files"] = uploaded_files

        # Return list of files and available bank configs
        # Get config directory path (project root / config)
        config_path = Path(__file__).parent.parent.parent.parent / "config"
        processor = BankTransactionProcessor(config_dir=str(config_path))
        processing_state["processor"] = processor

        bank_configs = processor.original_config_names

        return {
            "uploaded_files": [f["filename"] for f in uploaded_files],
            "bank_configs": bank_configs,
            "existing_transaction_count": len(existing_data)
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auto-categorize")
async def auto_categorize(bank_selections: List[dict]):
    """
    Step 2: Process files with selected bank configs and auto-categorize
    Returns categorized and uncategorized transactions
    """
    try:
        processor = processing_state["processor"]
        uploaded_files = processing_state["uploaded_files"]

        all_transactions = []

        # Process each file with its selected bank config
        for selection in bank_selections:
            filename = selection["filename"]
            bank_config = selection["bank_config"]

            # Find the file
            file_data = next((f for f in uploaded_files if f["filename"] == filename), None)
            if not file_data:
                continue

            # Load file into DataFrame
            content = file_data["content"]
            if filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content))
            elif filename.endswith('.xlsx'):
                df = pd.read_excel(io.BytesIO(content))
            else:
                continue

            # Process using bank config
            processed_df = processor._process_data(df, bank_config.lower())
            all_transactions.append(processed_df)

        # Combine all processed transactions
        if all_transactions:
            combined_df = pd.concat(all_transactions, ignore_index=True)
        else:
            return {"error": "No valid transactions processed"}

        # Convert to list of dicts
        combined_df['Date'] = combined_df['Date'].dt.strftime('%Y-%m-%d')

        # Replace NaN and Infinity values with None for JSON serialization
        combined_df = combined_df.replace({float('nan'): None, float('inf'): None, float('-inf'): None})
        combined_df = combined_df.where(pd.notna(combined_df), None)

        transactions = combined_df.to_dict('records')

        # Separate categorized and uncategorized
        categorized = [t for t in transactions if t['Category'] is not None]
        uncategorized = [t for t in transactions if t['Category'] is None]

        # Add index to uncategorized for reference
        for idx, t in enumerate(uncategorized):
            t['index'] = idx

        processing_state["new_transactions"] = transactions
        processing_state["uncategorized"] = uncategorized

        return {
            "total_new": len(transactions),
            "auto_categorized": len(categorized),
            "uncategorized": uncategorized,
            "uncategorized_count": len(uncategorized),
            "all_transactions": processing_state["new_transactions"],
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/label")
async def label_transaction(request: LabelRequest):
    """
    Step 3: Label a single uncategorized transaction
    """
    try:
        uncategorized = processing_state["uncategorized"]
        new_transactions = processing_state["new_transactions"]

        if request.index >= len(uncategorized):
            raise HTTPException(status_code=400, detail="Invalid transaction index")

        # Update category and description if provided
        transaction = uncategorized[request.index]
        old_description = transaction['Description']
        transaction['Category'] = request.category

        # Update description if provided
        if request.description and request.description != old_description:
            transaction['Description'] = request.description

        # Update in main transactions list
        for t in new_transactions:
            if (t['Date'] == transaction['Date'] and
                t['Description'] == old_description and
                t['Amount'] == transaction['Amount']):
                t['Category'] = request.category
                # Update description in main list too
                if request.description and request.description != old_description:
                    t['Description'] = request.description
                break

        # Save to category mapping if requested
        if request.save_to_mapping:
            processor = processing_state["processor"]
            category_mapping = processor.category_mapping

            if request.category not in category_mapping:
                category_mapping[request.category] = {"contains": []}

            description = transaction['Description']
            if description not in category_mapping[request.category]['contains']:
                category_mapping[request.category]['contains'].append(description)

            # Save to file
            config_path = Path(__file__).parent.parent.parent.parent / "config"
            mapping_path = config_path / "category_mapping.json"
            with open(mapping_path, 'w', encoding='utf-8') as f:
                json.dump(category_mapping, f, indent=4)

        # Remove from uncategorized
        uncategorized.pop(request.index)

        # Re-index remaining
        for idx, t in enumerate(uncategorized):
            t['index'] = idx

        return {
            "success": True,
            "remaining_uncategorized": len(uncategorized)
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/drop")
async def drop_transaction(request: DropRequest):
    """
    Drop a transaction (remove it completely from the dataset)
    """
    try:
        uncategorized = processing_state["uncategorized"]
        new_transactions = processing_state["new_transactions"]

        if request.index >= len(uncategorized):
            raise HTTPException(status_code=400, detail="Invalid transaction index")

        # Get the transaction to drop
        transaction = uncategorized[request.index]

        # Remove from new_transactions list
        for i, t in enumerate(new_transactions):
            if (t['Date'] == transaction['Date'] and
                t['Description'] == transaction['Description'] and
                t['Amount'] == transaction['Amount']):
                new_transactions.pop(i)
                break

        # Remove from uncategorized
        uncategorized.pop(request.index)

        # Re-index remaining
        for idx, t in enumerate(uncategorized):
            t['index'] = idx

        return {
            "success": True,
            "remaining_uncategorized": len(uncategorized)
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/export")
async def export_json():
    """
    Step 4: Export final merged JSON
    """
    try:
        existing_data = processing_state["existing_data"]
        new_transactions = processing_state["new_transactions"]

        # Merge existing and new
        merged_data = existing_data + new_transactions

        # Sort ascending by date
        merged_df = pd.DataFrame(merged_data)
        merged_df['Date'] = pd.to_datetime(merged_df['Date'], format='mixed', dayfirst=False)
        merged_df = merged_df.sort_values('Date', ascending=True)

        # Compute filename from last day of the newest record's month (while dates are still datetime)
        max_date = merged_df['Date'].max()
        last_day = calendar.monthrange(max_date.year, max_date.month)[1]
        filename = f"expense_{max_date.year}-{max_date.month:02d}-{last_day:02d}.json"

        # Match notebook exactly: MM/DD/YYYY date format
        merged_df['Date'] = merged_df['Date'].dt.strftime('%m/%d/%Y')

        # Keep only the 7 standard fields matching the notebook output
        standard_cols = ['Date', 'Amount', 'Description', 'Category', 'Currency', 'Card', 'Bank']
        merged_df = merged_df[[c for c in standard_cols if c in merged_df.columns]]

        # Use pandas to_json matching the notebook: orient='records', lines=True
        json_lines = merged_df.to_json(orient='records', lines=True)
        return Response(
            content=json_lines,
            media_type='application/json',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/categories")
async def get_categories():
    """
    Get list of available categories
    """
    try:
        processor = processing_state.get("processor")
        if not processor:
            # Get config directory path (project root / config)
            config_path = Path(__file__).parent.parent.parent.parent / "config"
            processor = BankTransactionProcessor(config_dir=str(config_path))
            processing_state["processor"] = processor

        categories = list(processor.category_mapping.keys())
        return {"categories": categories}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
