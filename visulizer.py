import dash
from dash import dcc, html
from dash.dependencies import Input, Output
from datetime import datetime
import pandas as pd
import plotly.express as px
import base64
import io

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

# Layout of the dashboard
app.layout = html.Div([
    html.H1("Monthly Expense Dashboard"),

    dcc.Upload(
        id='upload-data',
        children=html.Button('Upload File'),
        multiple=False
    ),

    html.Div([
        dcc.Dropdown(
            id='year-dropdown',
            multi=True,
            placeholder='Select Year(s)'
        ),
        dcc.Dropdown(
            id='category-filter',
            multi=True,
            placeholder='Select Categories',
            clearable=True
        ),
    ], style={'marginBottom': 20}),

    dcc.Dropdown(
        id='currency-selector',
        options=[
            {'label': 'GBP (£)', 'value': 'GBP'},
            {'label': 'USD ($)', 'value': 'USD'},
            {'label': 'RMB (¥)', 'value': 'RMB'}
        ],
        value='GBP',
        clearable=False,
        style={'marginBottom': 10}
    ),

    dcc.Checklist(id='higher-category-checkbox', options=[{'label': 'Enable Higher Level Category', 'value': 'Higher_Category'}], value=['Higher_Category']),

    html.Div(id='total-spent', style={'fontSize': 20, 'fontWeight': 'bold', 'marginTop': 20, 'marginBottom': 10}),
    html.Div(id='average-spent', style={'fontSize': 20, 'fontWeight': 'bold', 'marginBottom': 20}),

    dcc.Graph(id='expense-line-chart', style={'height': '400px'}),
    dcc.Graph(id='expense-bar-chart', style={'height': '800px'}),

    html.Table(id='expense-table')
])

# Function to load and process the data
def load_and_process_data(contents, use_higher_category):
    global uploaded_df

    content_type, content_string = contents.split(',')
    decoded = base64.b64decode(content_string)
    uploaded_df = pd.read_json(io.StringIO(decoded.decode('utf-8')), orient='records', lines=True)[['Date', 'Description', 'Category', 'Final_Amount']]
    uploaded_df = uploaded_df.rename(columns={'Final_Amount': 'Amount'})
    uploaded_df['Amount'] = uploaded_df['Amount'].round(2)
    uploaded_df['Year_Month'] = pd.to_datetime(uploaded_df['Date']).dt.strftime('%Y-%m')

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
     Input('currency-selector', 'value')]
)
def update_uploaded_file(contents, use_higher_category, selected_years, selected_categories, selected_currency):
    if contents is None:
        return px.bar(), px.line(), f"Total Spent: {currency_symbols[selected_currency]}0", f"Average per Month: {currency_symbols[selected_currency]}0", [], [], [], []

    global uploaded_df
    load_and_process_data(contents, use_higher_category)

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
    
    # Always select all categories if none are selected
    if selected_categories is None or len(selected_categories) == 0:
        selected_categories = all_categories

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

    # Calculate total spent and average per month
    total_spent = filtered_df['Amount'].sum()
    num_months = len(filtered_df['Year_Month'].unique())
    avg_per_month = total_spent / num_months if num_months > 0 else 0

    # Create line chart for monthly totals with text annotations
    monthly_totals = filtered_df.groupby('Year_Month')['Amount'].sum().reset_index()
    monthly_totals['Year_Month'] = pd.to_datetime(monthly_totals['Year_Month'])
    monthly_totals['Amount'] = monthly_totals['Amount'].round(0)  # Round to whole numbers
    
    line_fig = px.line(
        monthly_totals,
        x='Year_Month',
        y='Amount',
        title='Monthly Total Expense',
        labels={'Amount': 'Total Expense', 'Year_Month': 'Month'}
    )
    
    # Add text annotations above each point with rounded numbers
    line_fig.update_traces(
        mode='lines+markers+text',
        text=monthly_totals['Amount'].apply(lambda x: f'{currency_symbol}{int(x):,}'),  # Remove decimals
        textposition='top center'
    )
    
    line_fig.update_layout(
        template='seaborn',
        plot_bgcolor='rgba(0, 0, 0, 0)',
        paper_bgcolor='rgba(0, 0, 0, 0)',
    )

    # Group by month and category for bar chart
    grouped_df = filtered_df[['Year_Month', 'Category', 'Amount']].groupby(['Year_Month', 'Category'], as_index=False).sum()
    grouped_df['Amount'] = grouped_df['Amount'].round(0)  # Round to whole numbers
    unique_months = sorted(filtered_df['Year_Month'].unique())
    color_scale = px.colors.cyclical.mygbm

    bar_fig = px.bar(
        grouped_df,
        x='Year_Month',
        y='Amount',
        color='Category',
        barmode='stack',
        labels={'Amount': 'Expense Amount'},
        title='Monthly Expense by Category',
        category_orders={'Year_Month': unique_months},
        color_continuous_scale=color_scale,
        text=grouped_df['Amount'].apply(lambda x: f'{currency_symbol}{int(x):,}'),  # Remove decimals
        hover_data=['Year_Month'],
    )

    bar_fig.update_layout(
        template='seaborn',
        plot_bgcolor='rgba(0, 0, 0, 0)',
        paper_bgcolor='rgba(0, 0, 0, 0)',
    )

    return (
        bar_fig, 
        line_fig, 
        f"Total Spent: {currency_symbol}{total_spent:,.2f}",
        f"Average per Month: {currency_symbol}{avg_per_month:,.2f}", 
        year_options, 
        selected_years, 
        category_options, 
        selected_categories
    )

# Callback to update the table based on the selected stack in the bar chart
@app.callback(
    Output('expense-table', 'children'),
    [Input('expense-bar-chart', 'clickData'),
     Input('currency-selector', 'value')]
)
def update_table(selected_data, selected_currency):
    if selected_data is None:
        return []

    global uploaded_df
    filtered_df = uploaded_df.copy()

    if selected_data and 'points' in selected_data:
        point = selected_data['points'][0]
        date = point['label']
        date_object = datetime.strptime(date, '%Y-%m-%d')
        year_month = date_object.strftime('%Y-%m')
        clicked_amount = round(float(point['value']))  # Round the clicked amount

        # Apply currency conversion to the filtered dataframe
        conversion_rate = currency_rates[selected_currency]
        filtered_df['Amount'] = (filtered_df['Amount'] * conversion_rate).round(0)  # Round after conversion

        # Group by month and category and aggregate the amount
        grouped_df = filtered_df[['Year_Month', 'Category', 'Amount']].groupby(['Year_Month', 'Category'], as_index=False).sum()
        grouped_df['Amount'] = grouped_df['Amount'].round(0)  # Round aggregated amounts

        # Find the category based on the selected month and approximate amount match
        # Increased tolerance to 2 units to account for rounding differences
        mask = (grouped_df['Year_Month'] == year_month) & (abs(grouped_df['Amount'] - clicked_amount) <= 2)
        if len(grouped_df[mask]) > 0:
            category = grouped_df[mask]['Category'].values[0]
            filtered_df = filtered_df[(filtered_df['Year_Month'] == year_month) & (filtered_df['Category'] == category)]
        else:
            # Fallback: try finding the closest amount for that month and category
            month_data = grouped_df[grouped_df['Year_Month'] == year_month]
            if not month_data.empty:
                closest_amount = month_data.iloc[(month_data['Amount'] - clicked_amount).abs().argsort()[:1]]
                category = closest_amount['Category'].values[0]
                filtered_df = filtered_df[(filtered_df['Year_Month'] == year_month) & 
                                       (filtered_df['Category'] == category)]
            else:
                return []

    # Sort by Amount in descending order
    filtered_df = filtered_df.sort_values(by='Amount', ascending=False)
    
    # Format amounts with currency symbol
    currency_symbol = currency_symbols[selected_currency]
    filtered_df['Amount'] = filtered_df['Amount'].apply(lambda x: f"{currency_symbol}{int(x):,}")

    # Display only relevant columns in the table
    table_columns = ['Date', 'Category', 'Description', 'Amount']
    table_rows = [html.Tr([html.Th(col) for col in table_columns])]

    for i in range(len(filtered_df)):
        table_rows.append(html.Tr([html.Td(filtered_df.iloc[i][col]) for col in table_columns]))

    return table_rows

if __name__ == '__main__':
    app.run_server(debug=True)