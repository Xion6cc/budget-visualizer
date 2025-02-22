from dash import html
from ..utils.styles import COLORS, CHART_STYLE

def create_table_rows(filtered_df, currency_symbol):
    """Create styled table rows from filtered data"""
    table_columns = ['Date', 'Category', 'Description', 'Amount']
    
    # Create header row
    header_row = html.Tr([
        html.Th(col, style={
            'backgroundColor': COLORS['secondary'],
            'padding': '15px',
            'textAlign': 'left',
            'color': COLORS['text'],
            'fontSize': f"{CHART_STYLE['table_font_size']}px",
            'fontWeight': 'bold'
        }) for col in table_columns
    ])

    # Create data rows
    data_rows = [
        html.Tr([
            html.Td(
                filtered_df.iloc[i][col],
                style={
                    'padding': '12px',
                    'borderBottom': f'1px solid {COLORS["secondary"]}',
                    'fontSize': f"{CHART_STYLE['table_font_size']}px",
                    'whiteSpace': 'nowrap'
                }
            ) for col in table_columns
        ]) for i in range(len(filtered_df))
    ]

    return [header_row] + data_rows 