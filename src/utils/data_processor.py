import pandas as pd
import base64
import io
from .constants import CATEGORY_MAPPING

def load_and_process_data(contents, use_higher_category, time_period):
    """Process uploaded data file and return formatted DataFrame"""
    content_type, content_string = contents.split(',')
    decoded = base64.b64decode(content_string)
    df = pd.read_json(io.StringIO(decoded.decode('utf-8')), orient='records', lines=True)
    
    return process_dataframe(df, use_higher_category, time_period)

def process_dataframe(df, use_higher_category, time_period):
    """Process DataFrame with time periods and categories"""
    df = df[['Date', 'Description', 'Category', 'Final_Amount']].copy()
    df = df.rename(columns={'Final_Amount': 'Amount'})
    df['Amount'] = df['Amount'].round(2)
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Add time period columns
    df['Year'] = df['Date'].dt.year
    df['Year_Month'] = df['Date'].dt.strftime('%Y-%m')
    df['Year_Week'] = df['Date'].dt.strftime('%Y-%m-%d')
    
    # Set time period
    if time_period == 'year':
        df['Time_Period'] = df['Year'].astype(str)
    elif time_period == 'week':
        df['Time_Period'] = df['Date'].dt.to_period('W-MON').dt.start_time.dt.strftime('%Y-%m-%d')
    else:  # month
        df['Time_Period'] = df['Year_Month']

    # Apply category mapping if needed
    if 'Higher_Category' in use_higher_category:
        df['Category'] = df['Category'].map(CATEGORY_MAPPING)
    
    return df 