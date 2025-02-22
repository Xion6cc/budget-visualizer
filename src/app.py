import dash
import logging
from .layouts.main_layout import create_layout
from .callbacks.update_data import register_data_callbacks
from .callbacks.update_table import register_table_callbacks

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Dash app
app = dash.Dash(__name__)

# Set up the layout
app.layout = create_layout()

# Register callbacks
register_data_callbacks(app)
register_table_callbacks(app)

if __name__ == '__main__':
    app.run_server(debug=True) 