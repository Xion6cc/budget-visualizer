from dash import html, dcc
from ..utils.styles import COLORS, CHART_STYLE, CONTAINER_STYLE
from .components import (
    create_upload_button,
    create_time_selector,
    create_dropdowns,
    create_category_checkbox
)

def create_layout():
    return html.Div([
        # Header
        html.H1("Expense Dashboard", 
            style={
                'textAlign': 'center',
                'color': COLORS['text'],
                'fontFamily': CHART_STYLE['font_family'],
                'fontSize': '32px',
                'marginBottom': '30px'
            }
        ),

        # Controls and Summary Container
        html.Div([
            # Controls
            html.Div([
                create_upload_button(),
                create_time_selector(),
                create_dropdowns(),
                create_category_checkbox(),
            ], style={'flex': '0.2', 'marginRight': '20px'}),

            # Summary
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

        # Charts
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

        # Table
        html.Div([
            html.Table(
                id='expense-table',
                style={
                    'width': '100%',
                    'borderCollapse': 'collapse',
                    'fontFamily': CHART_STYLE['font_family'],
                    'fontSize': CHART_STYLE['table_font_size']
                }
            )
        ], style={
            'maxHeight': '500px',
            'overflowY': 'auto',
            'marginTop': '20px'
        })
    ], style=CONTAINER_STYLE) 