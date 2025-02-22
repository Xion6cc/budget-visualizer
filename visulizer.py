import dash
from dash import dcc, html
from dash.dependencies import Input, Output
from datetime import datetime
import pandas as pd
import plotly.express as px
import base64
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dash app
app = dash.Dash(__name__)

# Global variable to store the data
uploaded_df = None

# Category mapping
category_mapping = {
    'Education': 'Others',
    'Travel': 'Travel',
    'Health': 'Others',
    'Miscellaneous': 'Others',
    'Entertainment': 'Entertainment & Shopping',
    'Shopping': 'Entertainment & Shopping',
    'Transportation': 'Transportation',
    'Flight': 'Transportation',
    'Living': 'Living',
    'Rent': 'Living',
    'Home Setup': 'Living',
    'Restaurant': 'Restaurant',
    'Grocery': 'Grocery',
    'Gift': 'Gift',
    'Investment': 'Investment'
}

# Add currency conversion rates
currency_rates = {
    'GBP': 1.0,
    'USD': 1.25,
    'RMB': 9.2
}

currency_symbols = {
    'GBP': '£',
    'USD': '$',
    'RMB': '¥'
}

# Add these style constants at the top of the file after imports
COLORS = {
    'background': '#FFFFFF',
    'text': '#2C3E50',
    'primary': '#3498DB',
    'secondary': '#E5E7E9'
}

CHART_STYLE = {
    'font_family': 'Helvetica',
    'title_font_size': 24,
    'axis_font_size': 14,
    'label_font_size': 12,
    'table_font_size': 16  # Added new table font size
}

# Common styles for components
DROPDOWN_STYLE = {
    'backgroundColor': COLORS['background'],
    'color': COLORS['text'],
    'border': f'1px solid {COLORS["secondary"]}',
    'borderRadius': '4px',
    'marginBottom': '10px',
    'width': '100%'
}

CONTAINER_STYLE = {
    'maxWidth': '1800px',
    'margin': '0 auto',
    'padding': '20px',
    'backgroundColor': COLORS['background']
}

# Layout of the dashboard
app.layout = html.Div([
    html.H1("Expense Dashboard", 
        style={
            'textAlign': 'center',
            'color': COLORS['text'],
            'fontFamily': CHART_STYLE['font_family'],
            'fontSize': '32px',
            'marginBottom': '30px'
        }
    ),

    html.Div([
        # Controls container - made narrower
        html.Div([
            dcc.Upload(
                id='upload-data',
                children=html.Button('Upload File', 
                    style={
                        'backgroundColor': COLORS['primary'],
                        'color': 'white',
                        'border': 'none',
                        'padding': '10px 20px',
                        'borderRadius': '4px',
                        'cursor': 'pointer'
                    }
                ),
                multiple=False,
                style={'marginBottom': '20px'}
            ),

            dcc.RadioItems(
                id='time-period-selector',
                options=[
                    {'label': 'Yearly', 'value': 'year'},
                    {'label': 'Monthly', 'value': 'month'},
                    {'label': 'Weekly', 'value': 'week'}
                ],
                value='month',
                inline=True,
                style={
                    'marginBottom': '20px',
                    'fontFamily': CHART_STYLE['font_family'],
                    'fontSize': CHART_STYLE['label_font_size']
                }
            ),

            dcc.Dropdown(
                id='year-dropdown',
                multi=True,
                placeholder='Select Year(s)',
                style=DROPDOWN_STYLE
            ),

            dcc.Dropdown(
                id='category-filter',
                multi=True,
                placeholder='Select Categories',
                style=DROPDOWN_STYLE
            ),

            dcc.Dropdown(
                id='currency-selector',
                options=[
                    {'label': 'GBP (£)', 'value': 'GBP'},
                    {'label': 'USD ($)', 'value': 'USD'},
                    {'label': 'RMB (¥)', 'value': 'RMB'}
                ],
                value='GBP',
                clearable=False,
                style=DROPDOWN_STYLE
            ),

            dcc.Checklist(
                id='higher-category-checkbox',
                options=[{'label': 'Enable Higher Level Category', 'value': 'Higher_Category'}],
                value=['Higher_Category'],
                style={
                    'marginTop': '20px',
                    'fontFamily': CHART_STYLE['font_family'],
                    'fontSize': CHART_STYLE['label_font_size']
                }
            ),
        ], style={'flex': '0.2', 'marginRight': '20px'}),

        # Summary container - made wider
        html.Div([
            html.Div(
                id='total-spent',
                style={
                    'fontSize': '24px',
                    'fontWeight': 'bold',
                    'marginBottom': '10px',
                    'color': COLORS['text'],
                    'fontFamily': CHART_STYLE['font_family']
                }
            ),
            html.Div(
                id='average-spent',
                style={
                    'fontSize': '24px',
                    'fontWeight': 'bold',
                    'marginBottom': '20px',
                    'color': COLORS['text'],
                    'fontFamily': CHART_STYLE['font_family']
                }
            ),
        ], style={'flex': '0.8'})
    ], style={'display': 'flex', 'marginBottom': '30px'}),

    # Charts container - updated heights and layout
    html.Div([
        dcc.Graph(
            id='expense-line-chart',
            style={'height': '500px', 'marginBottom': '30px'}
        ),
        dcc.Graph(
            id='expense-bar-chart',
            style={'height': '700px', 'marginBottom': '30px'}
        ),
    ]),

    # Table container - updated font size
    html.Div([
        html.Table(
            id='expense-table',
            style={
                'width': '100%',
                'borderCollapse': 'collapse',
                'fontFamily': CHART_STYLE['font_family'],
                'fontSize': CHART_STYLE['table_font_size']  # Updated font size
            }
        )
    ], style={
        'maxHeight': '500px',
        'overflowY': 'auto',
        'marginTop': '20px'
    })
], style=CONTAINER_STYLE)

# Function to load and process the data
def load_and_process_data(contents, use_higher_category, time_period):
    global uploaded_df

    content_type, content_string = contents.split(',')
    decoded = base64.b64decode(content_string)
    uploaded_df = pd.read_json(io.StringIO(decoded.decode('utf-8')), orient='records', lines=True)[['Date', 'Description', 'Category', 'Final_Amount']]
    uploaded_df = uploaded_df.rename(columns={'Final_Amount': 'Amount'})
    uploaded_df['Amount'] = uploaded_df['Amount'].round(2)
    
    # Convert Date to datetime
    uploaded_df['Date'] = pd.to_datetime(uploaded_df['Date'])
    
    # Create different time period groupings
    uploaded_df['Year'] = uploaded_df['Date'].dt.year
    uploaded_df['Year_Month'] = uploaded_df['Date'].dt.strftime('%Y-%m')
    # Use the start of each week for the week period
    uploaded_df['Year_Week'] = uploaded_df['Date'].dt.strftime('%Y-%m-%d')  # Store full date for weekly view
    
    # Set the time period column based on selection
    if time_period == 'year':
        uploaded_df['Time_Period'] = uploaded_df['Year'].astype(str)
    elif time_period == 'week':
        # Group by the start of each week
        uploaded_df['Time_Period'] = uploaded_df['Date'].dt.to_period('W-MON').dt.start_time.dt.strftime('%Y-%m-%d')
    else:  # month
        uploaded_df['Time_Period'] = uploaded_df['Year_Month']

    # Map categories to higher level categories if the checkbox is checked
    if 'Higher_Category' in use_higher_category:
        uploaded_df['Category'] = uploaded_df['Category'].map(category_mapping)

# Callback to read uploaded file, update dropdown options, and calculate total spent
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
def update_uploaded_file(contents, use_higher_category, selected_years, selected_categories, selected_currency, time_period):
    if contents is None:
        return px.bar(), px.line(), f"Total Spent: {currency_symbols[selected_currency]}0", f"Average per Period: {currency_symbols[selected_currency]}0", [], [], [], []

    global uploaded_df
    load_and_process_data(contents, use_higher_category, time_period)

    # Extract years and set dropdown options
    uploaded_df['Year'] = pd.to_datetime(uploaded_df['Date']).dt.year
    years = sorted(uploaded_df['Year'].unique())
    year_options = [{'label': str(year), 'value': year} for year in years]
    
    # Set default year to most recent
    if not selected_years:
        selected_years = [max(years)]

    # Set category options and default value (all categories selected)
    all_categories = sorted(uploaded_df['Category'].unique())
    category_options = [{'label': cat, 'value': cat} for cat in all_categories]
    
    # Always select all categories if none are selected OR if higher-level category checkbox was just changed
    if selected_categories is None or len(selected_categories) == 0 or use_higher_category != getattr(update_uploaded_file, 'last_use_higher_category', None):
        selected_categories = all_categories
    
    # Store the current state of use_higher_category for next comparison
    update_uploaded_file.last_use_higher_category = use_higher_category

    # Filter data based on selected years and categories
    filtered_df = uploaded_df.copy()
    if selected_years:
        filtered_df = filtered_df[filtered_df['Year'].isin(selected_years)]
    if selected_categories:
        filtered_df = filtered_df[filtered_df['Category'].isin(selected_categories)]

    # Apply currency conversion
    conversion_rate = currency_rates[selected_currency]
    filtered_df['Amount'] = filtered_df['Amount'] * conversion_rate
    
    # Update the currency symbol in displays
    currency_symbol = currency_symbols[selected_currency]

    # Calculate total spent and average per period
    total_spent = filtered_df['Amount'].sum()
    num_periods = len(filtered_df['Time_Period'].unique())
    avg_per_period = total_spent / num_periods if num_periods > 0 else 0

    period_label = 'Year' if time_period == 'year' else 'Month' if time_period == 'month' else 'Week'

    # Create line chart for period totals
    period_totals = filtered_df.groupby('Time_Period')['Amount'].sum().reset_index()
    
    # Convert Time_Period to datetime with appropriate format
    if time_period == 'year':
        period_totals['Time_Period'] = pd.to_datetime(period_totals['Time_Period'], format='%Y')
    elif time_period == 'week':
        period_totals['Time_Period'] = pd.to_datetime(period_totals['Time_Period'])
    else:  # month
        period_totals['Time_Period'] = pd.to_datetime(period_totals['Time_Period'], format='%Y-%m')
    
    period_totals['Amount'] = period_totals['Amount'].round(0)
    
    line_fig = px.line(
        period_totals,
        x='Time_Period',
        y='Amount',
        title=f'{period_label}ly Total Expense',
        labels={'Amount': 'Total Expense', 'Time_Period': period_label}
    )
    
    line_fig.update_traces(
        mode='lines+markers+text',
        text=period_totals['Amount'].apply(lambda x: f'{currency_symbol}{int(x):,}'),
        textposition='top center',
        line=dict(width=3),
        marker=dict(size=8)
    )
    
    line_fig.update_layout(
        font_family=CHART_STYLE['font_family'],
        title_font_size=CHART_STYLE['title_font_size'],
        font_size=CHART_STYLE['axis_font_size'],
        plot_bgcolor='white',
        paper_bgcolor='white',
        xaxis=dict(showgrid=True, gridwidth=1, gridcolor=COLORS['secondary']),
        yaxis=dict(showgrid=True, gridwidth=1, gridcolor=COLORS['secondary']),
        margin=dict(l=50, r=50, t=50, b=50),
        height=500
    )

    # Group by period and category for bar chart
    grouped_df = filtered_df[['Time_Period', 'Category', 'Amount']].groupby(['Time_Period', 'Category'], as_index=False).sum()
    grouped_df['Amount'] = grouped_df['Amount'].round(0)
    unique_periods = sorted(filtered_df['Time_Period'].unique())

    bar_fig = px.bar(
        grouped_df,
        x='Time_Period',
        y='Amount',
        color='Category',
        barmode='stack',
        labels={'Amount': 'Expense Amount'},
        title=f'{period_label}ly Expense by Category',
        category_orders={'Time_Period': unique_periods},
        text=grouped_df['Amount'].apply(lambda x: f'{currency_symbol}{int(x):,}')
    )

    bar_fig.update_layout(
        font_family=CHART_STYLE['font_family'],
        title_font_size=CHART_STYLE['title_font_size'],
        font_size=CHART_STYLE['axis_font_size'],
        plot_bgcolor='white',
        paper_bgcolor='white',
        xaxis=dict(showgrid=True, gridwidth=1, gridcolor=COLORS['secondary']),
        yaxis=dict(showgrid=True, gridwidth=1, gridcolor=COLORS['secondary']),
        margin=dict(l=50, r=50, t=80, b=50),
        height=700,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1,
            font=dict(size=12)
        )
    )

    return (
        bar_fig, 
        line_fig, 
        f"Total Spent: {currency_symbol}{total_spent:,.2f}",
        f"Average per {period_label}: {currency_symbol}{avg_per_period:,.2f}", 
        year_options, 
        selected_years, 
        category_options, 
        selected_categories
    )

# Callback to update the table based on the selected stack in the bar chart
@app.callback(
    Output('expense-table', 'children'),
    [Input('expense-bar-chart', 'clickData'),
     Input('currency-selector', 'value'),
     Input('time-period-selector', 'value')]
)
def update_table(selected_data, selected_currency, time_period):
    if selected_data is None:
        return []

    global uploaded_df
    filtered_df = uploaded_df.copy()

    if selected_data and 'points' in selected_data:
        point = selected_data['points'][0]
        clicked_amount = round(float(point['value']))
        selected_period = point['x']
        
        logger.debug(f"Click data - Period: {selected_period}, Amount: {clicked_amount}")
        logger.debug(f"Time period type: {time_period}")

        # Apply currency conversion
        conversion_rate = currency_rates[selected_currency]
        filtered_df['Amount'] = (filtered_df['Amount'] * conversion_rate).round(0)

        # Convert selected_period to match the format in filtered_df
        try:
            if time_period == 'year':
                selected_period = str(pd.to_datetime(selected_period).year)
            elif time_period == 'month':
                selected_period = pd.to_datetime(selected_period).strftime('%Y-%m')
            elif time_period == 'week':
                selected_period = pd.to_datetime(selected_period).strftime('%Y-%m-%d')
            
            logger.debug(f"Converted selected period: {selected_period}")
            
            # Log unique Time_Period values in filtered_df
            unique_periods = filtered_df['Time_Period'].unique()
            logger.debug(f"Available periods in data: {unique_periods}")
            
        except Exception as e:
            logger.error(f"Error converting period: {e}")
            return []

        # Filter by time period and category
        grouped_df = filtered_df.groupby(['Time_Period', 'Category'])['Amount'].sum().reset_index()
        
        # Log the grouped data
        logger.debug(f"Grouped data sample:\n{grouped_df.head()}")
        
        # Increase tolerance for amount matching and log the matches
        tolerance = 5  # Increased from 2 to 5
        mask = (grouped_df['Time_Period'] == selected_period) & (abs(grouped_df['Amount'] - clicked_amount) <= tolerance)
        matching_rows = grouped_df[mask]
        
        logger.debug(f"Matching rows found: {len(matching_rows)}")
        if len(matching_rows) > 0:
            logger.debug(f"Matching data:\n{matching_rows}")
            
        if len(matching_rows) > 0:
            category = matching_rows['Category'].values[0]
            filtered_df = filtered_df[
                (filtered_df['Time_Period'] == selected_period) & 
                (filtered_df['Category'] == category)
            ]
            logger.debug(f"Found matching category: {category}")
            logger.debug(f"Number of matching transactions: {len(filtered_df)}")
        else:
            logger.debug("No matches found with current tolerance")
            # Try finding the closest match
            closest_match = grouped_df[grouped_df['Time_Period'] == selected_period]
            if not closest_match.empty:
                closest_match['diff'] = abs(closest_match['Amount'] - clicked_amount)
                closest_match = closest_match.nsmallest(1, 'diff')
                logger.debug(f"Closest match:\n{closest_match}")
                category = closest_match['Category'].values[0]
                filtered_df = filtered_df[
                    (filtered_df['Time_Period'] == selected_period) & 
                    (filtered_df['Category'] == category)
                ]
                logger.debug(f"Using closest match category: {category}")
            else:
                logger.debug("No matches found at all")
                return []

    # Sort by Amount in descending order and limit to top 100
    filtered_df = filtered_df.sort_values(by='Amount', ascending=False).head(100)
    
    # Format amounts with currency symbol
    currency_symbol = currency_symbols[selected_currency]
    filtered_df['Amount'] = filtered_df['Amount'].apply(lambda x: f"{currency_symbol}{int(x):,}")

    # Format date to be more readable
    filtered_df['Date'] = pd.to_datetime(filtered_df['Date']).dt.strftime('%Y-%m-%d')

    # Log final table size
    logger.debug(f"Final table size: {len(filtered_df)} rows")

    # Create table with larger text
    table_columns = ['Date', 'Category', 'Description', 'Amount']
    table_rows = [html.Tr([
        html.Th(col, style={
            'backgroundColor': COLORS['secondary'],
            'padding': '15px',  # Increased padding
            'textAlign': 'left',
            'color': COLORS['text'],
            'fontSize': f"{CHART_STYLE['table_font_size']}px",  # Explicit font size
            'fontWeight': 'bold'
        }) for col in table_columns
    ])]

    table_rows.extend([
        html.Tr([
            html.Td(
                filtered_df.iloc[i][col],
                style={
                    'padding': '12px',  # Increased padding
                    'borderBottom': f'1px solid {COLORS["secondary"]}',
                    'fontSize': f"{CHART_STYLE['table_font_size']}px",  # Explicit font size
                    'whiteSpace': 'nowrap'  # Prevent text wrapping
                }
            ) for col in table_columns
        ]) for i in range(len(filtered_df))
    ])

    return table_rows

if __name__ == '__main__':
    app.run_server(debug=True)