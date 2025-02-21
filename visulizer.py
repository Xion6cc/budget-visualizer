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
     Input('category-filter', 'value')]
)
def update_uploaded_file(contents, use_higher_category, selected_years, selected_categories):
    if contents is None:
        return px.bar(), px.line(), "Total Spent: £0", "Average per Month: £0", [], [], [], []

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

    # Calculate total spent and average per month
    total_spent = filtered_df['Amount'].sum()
    num_months = len(filtered_df['Year_Month'].unique())
    avg_per_month = total_spent / num_months if num_months > 0 else 0

    # Create line chart for monthly totals with text annotations
    monthly_totals = filtered_df.groupby('Year_Month')['Amount'].sum().reset_index()
    monthly_totals['Year_Month'] = pd.to_datetime(monthly_totals['Year_Month'])
    
    line_fig = px.line(
        monthly_totals,
        x='Year_Month',
        y='Amount',
        title='Monthly Total Expense',
        labels={'Amount': 'Total Expense', 'Year_Month': 'Month'}
    )
    
    # Add text annotations above each point
    line_fig.update_traces(
        mode='lines+markers+text',
        text=monthly_totals['Amount'].round(2).apply(lambda x: f'£{x:,.2f}'),
        textposition='top center'
    )
    
    line_fig.update_layout(
        template='seaborn',
        plot_bgcolor='rgba(0, 0, 0, 0)',
        paper_bgcolor='rgba(0, 0, 0, 0)',
    )

    # Group by month and category for bar chart
    grouped_df = filtered_df[['Year_Month', 'Category', 'Amount']].groupby(['Year_Month', 'Category'], as_index=False).sum()
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
        text='Amount',
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
        f"Total Spent: £{total_spent:,.2f}",
        f"Average per Month: £{avg_per_month:,.2f}", 
        year_options, 
        selected_years, 
        category_options, 
        selected_categories
    )

# Callback to update the table based on the selected stack in the bar chart
@app.callback(
    Output('expense-table', 'children'),
    [Input('expense-bar-chart', 'clickData')]
)
def update_table(selected_data):
    if selected_data is None:
        return []

    global uploaded_df

    filtered_df = uploaded_df.copy()

    if selected_data and 'points' in selected_data:
        point = selected_data['points'][0]
        date = point['label']
        date_object = datetime.strptime(date, '%Y-%m-%d')
        year_month = date_object.strftime('%Y-%m')
        amount = point['value']

        # Group by month and category and aggregate the amount
        grouped_df = uploaded_df[['Year_Month', 'Category', 'Amount']].groupby(['Year_Month', 'Category'], as_index=False).sum()

        # Find the category based on the selected month and amount
        category = grouped_df[(grouped_df['Year_Month'] == year_month) & (grouped_df['Amount'] == amount)]['Category'].values[0]

        filtered_df = filtered_df[(filtered_df['Year_Month'] == year_month) & (filtered_df['Category'] == category)]

    # Sort by Amount in descending order
    filtered_df = filtered_df.sort_values(by='Amount', ascending=False)
    # Display only relevant columns in the table
    table_columns = ['Date', 'Category', 'Description', 'Amount']
    table_rows = [html.Tr([html.Th(col) for col in table_columns])]

    for i in range(len(filtered_df)):
        table_rows.append(html.Tr([html.Td(filtered_df.iloc[i][col]) for col in table_columns]))

    return table_rows

if __name__ == '__main__':
    app.run_server(debug=True)