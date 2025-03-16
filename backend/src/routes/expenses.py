from fastapi import APIRouter, UploadFile, File, Query, HTTPException
from typing import List, Optional
import pandas as pd
from ..utils.data_processor import process_dataframe
import json
import traceback

router = APIRouter(prefix="/expenses")

# Store data in memory (for demo purposes)
_stored_data = None
_original_data = None  # Store the original data for reprocessing

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    use_higher_category: bool = Query(False),
    time_period: str = Query("month")
):
    try:
        contents = await file.read()
        # Try to parse as JSONL first
        try:
            # Split by newlines and parse each line as JSON
            lines = contents.decode('utf-8').strip().split('\n')
            data = [json.loads(line) for line in lines]
        except:
            # If JSONL parsing fails, try regular JSON
            data = json.loads(contents)
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Round up the Amount column to 2 decimal places
        if 'Amount' in df.columns:
            df['Amount'] = df['Amount'].round(2)
        
        # Convert Date column to datetime
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Store the original data
        global _original_data
        _original_data = df.copy()
        
        # Process the data and store it globally
        global _stored_data
        processed_df = process_dataframe(df, use_higher_category, time_period)
        _stored_data = processed_df
        
        # Get unique categories and years
        categories = processed_df['Category'].unique().tolist()
        years = sorted(df['Date'].dt.year.unique().tolist())
        
        print(f"Successfully processed data:")
        print(f"- Number of rows: {len(df)}")
        print(f"- Available years: {years}")
        print(f"- Available categories: {categories}")
        
        return {
            "message": "File uploaded successfully",
            "categories": categories,
            "years": years
        }
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        print("Traceback:", traceback.format_exc())
        raise HTTPException(status_code=422, detail=str(e))

@router.get("")
async def get_expenses(
    time_period: str = Query(...),
    categories: Optional[List[str]] = Query(None),
    currency: str = Query("GBP"),
    use_higher_category: bool = Query(False),
    years: Optional[List[int]] = Query(None)
):
    global _stored_data, _original_data
    if _original_data is None:
        return {"barChartData": [], "lineChartData": []}

    try:
        # Start with original data
        filtered_data = _original_data.copy()
        
        # Apply year filter first
        print(f"Filtering data for years: {years}")
        if years and len(years) > 0:
            filtered_data = filtered_data[filtered_data['Date'].dt.year.isin(years)]
            print(f"Data filtered to {len(filtered_data)} rows after year filter")
        
        # Process the filtered data with the current time period
        print(f"Processing data with time_period: {time_period}")
        processed_df = process_dataframe(filtered_data, use_higher_category, time_period)
        
        # Debug output
        print(f"Processed data columns: {processed_df.columns.tolist()}")
        print(f"Time_Period values: {processed_df['Time_Period'].unique().tolist()}")
        
        # Apply category filter
        if categories and len(categories) > 0:
            processed_df = processed_df[processed_df['Category'].isin(categories)]
            print(f"Data filtered to {len(processed_df)} rows after category filter")

        # Convert amount to selected currency
        if currency != "GBP":
            from ..utils.constants import CURRENCY_RATES
            processed_df['Amount'] = processed_df['Amount'] * CURRENCY_RATES[currency]
            processed_df['Amount'] = processed_df['Amount'].round(2)

        # Group by time period and category for bar chart
        bar_data = (processed_df.groupby(['Time_Period', 'Category'])['Amount']
                    .sum()
                    .reset_index()
                    .sort_values('Time_Period'))
        
        # Round amounts to 2 decimal places
        bar_data['Amount'] = bar_data['Amount'].round(2)
        
        bar_chart_data = [
            {
                "timePeriod": row['Time_Period'],
                "category": row['Category'],
                "amount": float(row['Amount'])
            }
            for _, row in bar_data.iterrows()
        ]

        # Group by time period for line chart
        line_data = processed_df.groupby('Time_Period')['Amount'].sum().reset_index()
        
        # Round amounts to 2 decimal places
        line_data['Amount'] = line_data['Amount'].round(2)
        
        line_chart_data = [
            {
                "timePeriod": row['Time_Period'],
                "amount": float(row['Amount']),
                "category": "Total"
            }
            for _, row in line_data.iterrows()
        ]

        print(f"Returning data with {len(bar_chart_data)} bar chart points and {len(line_chart_data)} line chart points")
        return {
            "barChartData": bar_chart_data,
            "lineChartData": line_chart_data
        }
    except Exception as e:
        print(f"Error processing expense data: {str(e)}")
        print("Traceback:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/details")
async def get_expense_details(
    category: str, 
    time_period: str, 
    currency: str = "GBP",
    use_higher_category: bool = False
):
    if _stored_data is None:
        return {"details": []}
    
    df = _stored_data.copy()
    
    # Apply higher category mapping if requested
    if use_higher_category:
        from ..utils.constants import CATEGORY_MAPPING
        df['Category'] = df['Category'].map(lambda x: CATEGORY_MAPPING.get(x, x))
    
    # Filter by category
    filtered_df = df[df['Category'] == category]
    
    # Parse the time period and filter accordingly
    if '-W' in time_period:  # Weekly format (e.g., "2024-W29")
        year, week = time_period.split('-W')
        filtered_df = filtered_df[(filtered_df['Year'] == int(year)) & (filtered_df['Week'] == int(week))]
    elif len(time_period) == 4:  # Yearly format (e.g., "2024")
        filtered_df = filtered_df[filtered_df['Year'] == int(time_period)]
    else:  # Monthly format (e.g., "2024-07")
        year, month = time_period.split('-')
        filtered_df = filtered_df[(filtered_df['Year'] == int(year)) & (filtered_df['Month'] == int(month))]
    
    # Convert currency if needed
    if currency != "GBP":
        from ..utils.constants import CURRENCY_RATES
        rate = CURRENCY_RATES.get(currency, 1.0)
        filtered_df['Amount'] = filtered_df['Amount'] * rate
    
    # Sort by amount in descending order
    filtered_df = filtered_df.sort_values('Amount', ascending=False)
    
    # Format the results
    details = []
    for _, row in filtered_df.iterrows():
        details.append({
            "date": row['Date'].strftime('%Y-%m-%d'),
            "description": row['Description'],
            "category": row['Category'],
            "amount": round(row['Amount'], 2),
            "currency": currency  # Include the currency in the response
        })
    
    print(f"Returning {len(details)} expense details for category={category}, time_period={time_period}, currency={currency}")
    return {"details": details} 