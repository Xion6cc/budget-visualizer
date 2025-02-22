import plotly.express as px
from ..utils.styles import COLORS, CHART_STYLE

def create_line_chart(period_totals, period_label, currency_symbol):
    """Create line chart for total expenses"""
    fig = px.line(
        period_totals,
        x='Time_Period',
        y='Amount',
        title=f'{period_label}ly Total Expense',
        labels={'Amount': 'Total Expense', 'Time_Period': period_label}
    )
    
    fig.update_traces(
        mode='lines+markers+text',
        text=period_totals['Amount'].apply(lambda x: f'{currency_symbol}{int(x):,}'),
        textposition='top center',
        line=dict(width=3),
        marker=dict(size=8)
    )
    
    _apply_chart_styling(fig)
    return fig

def create_bar_chart(grouped_df, period_label, unique_periods, currency_symbol):
    """Create stacked bar chart for category expenses"""
    fig = px.bar(
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
    
    _apply_chart_styling(fig, is_bar=True)
    return fig

def _apply_chart_styling(fig, is_bar=False):
    """Apply common styling to charts"""
    fig.update_layout(
        font_family=CHART_STYLE['font_family'],
        title_font_size=CHART_STYLE['title_font_size'],
        font_size=CHART_STYLE['axis_font_size'],
        plot_bgcolor='white',
        paper_bgcolor='white',
        xaxis=dict(showgrid=True, gridwidth=1, gridcolor=COLORS['secondary']),
        yaxis=dict(showgrid=True, gridwidth=1, gridcolor=COLORS['secondary']),
        margin=dict(l=50, r=50, t=80 if is_bar else 50, b=50),
        height=700 if is_bar else 500
    )
    
    if is_bar:
        fig.update_layout(
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="right",
                x=1,
                font=dict(size=12)
            )
        ) 