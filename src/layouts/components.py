from dash import dcc, html
from ..utils.styles import COLORS, CHART_STYLE, DROPDOWN_STYLE

def create_upload_button():
    return dcc.Upload(
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
    )

def create_time_selector():
    return dcc.RadioItems(
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
    )

def create_dropdowns():
    return html.Div([
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
        )
    ])

def create_category_checkbox():
    return dcc.Checklist(
        id='higher-category-checkbox',
        options=[{'label': 'Enable Higher Level Category', 'value': 'Higher_Category'}],
        value=['Higher_Category'],
        style={
            'marginTop': '20px',
            'fontFamily': CHART_STYLE['font_family'],
            'fontSize': CHART_STYLE['label_font_size']
        }
    ) 