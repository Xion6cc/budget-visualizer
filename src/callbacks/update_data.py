from dash.dependencies import Input, Output
import plotly.express as px
import pandas as pd
import logging
from ..utils.data_processor import load_and_process_data
from ..utils.constants import CURRENCY_SYMBOLS, CURRENCY_RATES
from ..visualizations.charts import create_line_chart, create_bar_chart

logger = logging.getLogger(__name__)

# Global variable to store the data
uploaded_df = None

def register_data_callbacks(app):
    @app.callback(
        [Output('expense-bar-chart', 'figure'),
         Output('expense-line-chart', 'figure'),
         Output('total-spent', 'children'),
         Output('average-spent', 'children'),
         Output('year-dropdown', 'options'),
         Output('year-dropdown', 'value'),
         Output('category-filter', 'options'),
         Output('category-filter', 'value')],
        [Input('upload-data', 'contents'),
         Input('higher-category-checkbox', 'value'),
         Input('year-dropdown', 'value'),
         Input('category-filter', 'value'),
         Input('currency-selector', 'value'),
         Input('time-period-selector', 'value')]
    )
    def update_data(contents, use_higher_category, selected_years, selected_categories, 
                   selected_currency, time_period):
        global uploaded_df
        
        if contents is None:
            return (px.bar(), px.line(), 
                   f"Total Spent: {CURRENCY_SYMBOLS[selected_currency]}0", 
                   f"Average per Period: {CURRENCY_SYMBOLS[selected_currency]}0", 
                   [], [], [], [])

        # Load and process data
        uploaded_df = load_and_process_data(contents, use_higher_category, time_period)

        # Set year options and default selection
        years = sorted(uploaded_df['Year'].unique())
        year_options = [{'label': str(year), 'value': year} for year in years]
        if not selected_years:
            selected_years = [max(years)]

        # Set category options and selection
        all_categories = sorted(uploaded_df['Category'].unique())
        category_options = [{'label': cat, 'value': cat} for cat in all_categories]
        
        # Select all categories if none selected or if higher-level category changed
        if (selected_categories is None or len(selected_categories) == 0 or 
            use_higher_category != getattr(update_data, 'last_use_higher_category', None)):
            selected_categories = all_categories
        
        update_data.last_use_higher_category = use_higher_category

        # Filter and process data
        filtered_df = _filter_and_process_data(
            uploaded_df, selected_years, selected_categories, 
            selected_currency, time_period
        )

        # Create visualizations
        period_label = 'Year' if time_period == 'year' else 'Month' if time_period == 'month' else 'Week'
        line_fig, bar_fig = _create_visualizations(
            filtered_df, period_label, CURRENCY_SYMBOLS[selected_currency]
        )

        # Calculate summaries
        total_spent = filtered_df['Amount'].sum()
        num_periods = len(filtered_df['Time_Period'].unique())
        avg_per_period = total_spent / num_periods if num_periods > 0 else 0

        return (
            bar_fig,
            line_fig,
            f"Total Spent: {CURRENCY_SYMBOLS[selected_currency]}{total_spent:,.2f}",
            f"Average per {period_label}: {CURRENCY_SYMBOLS[selected_currency]}{avg_per_period:,.2f}",
            year_options,
            selected_years,
            category_options,
            selected_categories
        )

def _filter_and_process_data(df, selected_years, selected_categories, selected_currency, time_period):
    """Filter and process DataFrame based on selections"""
    filtered_df = df.copy()
    
    if selected_years:
        filtered_df = filtered_df[filtered_df['Year'].isin(selected_years)]
    if selected_categories:
        filtered_df = filtered_df[filtered_df['Category'].isin(selected_categories)]

    # Apply currency conversion
    filtered_df['Amount'] = filtered_df['Amount'] * CURRENCY_RATES[selected_currency]
    
    return filtered_df

def _create_visualizations(filtered_df, period_label, currency_symbol):
    """Create line and bar chart visualizations"""
    # Prepare data for line chart
    period_totals = filtered_df.groupby('Time_Period')['Amount'].sum().reset_index()
    period_totals['Time_Period'] = pd.to_datetime(period_totals['Time_Period'])
    period_totals['Amount'] = period_totals['Amount'].round(0)
    
    # Prepare data for bar chart
    grouped_df = filtered_df.groupby(['Time_Period', 'Category'])['Amount'].sum().reset_index()
    grouped_df['Amount'] = grouped_df['Amount'].round(0)
    unique_periods = sorted(filtered_df['Time_Period'].unique())

    # Create charts
    line_fig = create_line_chart(period_totals, period_label, currency_symbol)
    bar_fig = create_bar_chart(grouped_df, period_label, unique_periods, currency_symbol)
    
    return line_fig, bar_fig 