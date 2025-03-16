import pandas as pd
from typing import List, Optional
from .constants import CATEGORY_MAPPING, CURRENCY_RATES

# Global variable to store the uploaded data
_stored_data = None
_original_data = None  # Store original data to allow reprocessing

def get_stored_data() -> Optional[pd.DataFrame]:
    """Get the stored DataFrame"""
    global _stored_data
    return _stored_data

def process_dataframe(df, use_higher_category=False, time_period="month"):
    """
    Process the dataframe to prepare it for visualization.
    
    Args:
        df: The input dataframe
        use_higher_category: Whether to use higher-level categories
        time_period: The time period to group by (month, week, year)
        
    Returns:
        Processed dataframe
    """
    # Make a copy to avoid modifying the original
    processed_df = df.copy()
    
    # Convert currency to GBP if needed
    if 'Currency' in processed_df.columns:
        # Apply currency conversion
        processed_df['Amount'] = processed_df.apply(
            lambda row: round(row['Amount'] / CURRENCY_RATES.get(row['Currency'], 1.0), 2),
            axis=1
        )
    
    # Ensure Date is in datetime format
    if not pd.api.types.is_datetime64_dtype(processed_df['Date']):
        processed_df['Date'] = pd.to_datetime(processed_df['Date'])
    
    # Extract year, month, and week
    processed_df['Year'] = processed_df['Date'].dt.year
    processed_df['Month'] = processed_df['Date'].dt.month
    processed_df['Week'] = processed_df['Date'].dt.isocalendar().week
    
    # Set time period based on user selection
    if time_period == "year":
        processed_df['Time_Period'] = processed_df['Year'].astype(str)
    elif time_period == "week":
        # Format as YYYY-WXX (ISO week format)
        processed_df['Time_Period'] = processed_df['Date'].dt.strftime('%Y-W%V')
    else:  # Default to month
        # Format as YYYY-MM
        processed_df['Time_Period'] = processed_df['Date'].dt.strftime('%Y-%m')
    
    # Apply category mapping if requested
    if use_higher_category and 'Category' in processed_df.columns:
        processed_df['Category'] = processed_df['Category'].map(
            lambda x: CATEGORY_MAPPING.get(x, x)
        )
    
    print(f"Processed dataframe with time_period={time_period}:")
    print(f"- Shape: {processed_df.shape}")
    print(f"- Time periods: {processed_df['Time_Period'].nunique()}")
    print(f"- Categories: {processed_df['Category'].nunique()}")
    
    return processed_df

def reprocess_with_time_period(time_period: str, use_higher_category: bool = True) -> Optional[pd.DataFrame]:
    """Reprocess stored data with a different time period"""
    global _original_data
    if _original_data is not None:
        return process_dataframe(
            _original_data,
            use_higher_category,
            time_period
        )
    return None 