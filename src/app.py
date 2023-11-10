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
server = app.server

# Global variable to store the data
uploaded_df = None

# Category mapping
category_mapping = {
    'Education': 'Others',
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
    'Gift': 'Gift'
}

# Layout of the dashboard
app.layout = html.Div([
    html.H1("Monthly Expense Dashboard"),

    dcc.Upload(
        id='upload-data',
        children=html.Button('Upload File'),
        multiple=False
    ),

    dcc.Checklist(id='higher-category-checkbox', options=[{'label': 'Enable Higher Level Category', 'value': 'Higher_Category'}], value=['Higher_Category']),

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
    uploaded_df['Year_Month'] = pd.to_datetime(uploaded_df['Date']).dt.strftime('%Y-%m')


    # Map categories to higher level categories if the checkbox is checked
    if 'Higher_Category' in use_higher_category:
        uploaded_df['Category'] = uploaded_df['Category'].map(category_mapping)

# Callback to read uploaded file and update dropdown options
@app.callback(
    Output('expense-bar-chart', 'figure'),
    [Input('upload-data', 'contents'),
     Input('higher-category-checkbox', 'value')]
)
def update_uploaded_file(contents, use_higher_category):
    if contents is None:
        return px.bar()

    global uploaded_df
    load_and_process_data(contents, use_higher_category)

    # Group by month and category
    grouped_df = uploaded_df[['Year_Month', 'Category', 'Amount']].groupby(['Year_Month', 'Category'], as_index=False).sum()

    # Get unique months and sort them
    unique_months = sorted(uploaded_df['Year_Month'].unique())

    # Set a color scale for the bars using a cyclical color scale
    color_scale = px.colors.cyclical.mygbm

    fig = px.bar(
        grouped_df,
        x='Year_Month',
        y='Amount',
        color='Category',
        barmode='stack',
        labels={'Amount': 'Expense Amount'},
        title='Monthly Expense',
        category_orders={'Year_Month': unique_months},  # Specify the order of months
        color_continuous_scale=color_scale
    )

    # Customize chart appearance
    fig.update_layout(
        template='seaborn',  # You can change to other templates like 'plotly', 'seaborn', etc.
        plot_bgcolor='rgba(0, 0, 0, 0)',  # Set plot background color
        paper_bgcolor='rgba(0, 0, 0, 0)',  # Set paper background color
    )

    return fig

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