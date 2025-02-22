from dash.dependencies import Input, Output
import pandas as pd
import logging
from ..utils.constants import CURRENCY_RATES, CURRENCY_SYMBOLS
from ..visualizations.table import create_table_rows

logger = logging.getLogger(__name__)

def register_table_callbacks(app):
    @app.callback(
        Output('expense-table', 'children'),
        [Input('expense-bar-chart', 'clickData'),
         Input('currency-selector', 'value'),
         Input('time-period-selector', 'value')]
    )
    def update_table(selected_data, selected_currency, time_period):
        if selected_data is None or 'points' not in selected_data:
            return []

        from .update_data import uploaded_df  # Import here to avoid circular import
        if uploaded_df is None:
            return []

        try:
            filtered_df = _process_click_data(
                uploaded_df.copy(),
                selected_data,
                selected_currency,
                time_period
            )
            
            if filtered_df.empty:
                return []

            # Format the data for display
            filtered_df = _format_data_for_display(filtered_df, selected_currency)
            
            # Create and return table rows
            return create_table_rows(filtered_df, CURRENCY_SYMBOLS[selected_currency])

        except Exception as e:
            logger.error(f"Error updating table: {e}")
            return []

def _process_click_data(df, selected_data, selected_currency, time_period):
    """Process clicked data and return filtered DataFrame"""
    point = selected_data['points'][0]
    clicked_amount = round(float(point['value']))
    selected_period = point['x']
    
    logger.debug(f"Click data - Period: {selected_period}, Amount: {clicked_amount}")
    
    # Apply currency conversion
    df['Amount'] = (df['Amount'] * CURRENCY_RATES[selected_currency]).round(0)

    # Convert selected period to match DataFrame format
    selected_period = _convert_period_format(selected_period, time_period)
    
    # Find matching data
    return _find_matching_data(df, selected_period, clicked_amount)

def _convert_period_format(period, time_period):
    """Convert period to correct format based on time_period"""
    period_date = pd.to_datetime(period)
    if time_period == 'year':
        return str(period_date.year)
    elif time_period == 'month':
        return period_date.strftime('%Y-%m')
    else:  # week
        return period_date.strftime('%Y-%m-%d')

def _find_matching_data(df, selected_period, clicked_amount, tolerance=5):
    """Find matching data with tolerance"""
    grouped_df = df.groupby(['Time_Period', 'Category'])['Amount'].sum().reset_index()
    mask = (grouped_df['Time_Period'] == selected_period) & (abs(grouped_df['Amount'] - clicked_amount) <= tolerance)
    
    if not grouped_df[mask].empty:
        category = grouped_df[mask]['Category'].values[0]
        return df[
            (df['Time_Period'] == selected_period) & 
            (df['Category'] == category)
        ].sort_values(by='Amount', ascending=False).head(100)
    
    return pd.DataFrame()

def _format_data_for_display(df, selected_currency):
    """Format DataFrame for display"""
    df = df.copy()
    currency_symbol = CURRENCY_SYMBOLS[selected_currency]
    df['Amount'] = df['Amount'].apply(lambda x: f"{currency_symbol}{int(x):,}")
    df['Date'] = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d')
    return df 