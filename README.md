# Budget Visualizer

A web-based dashboard built with Dash to visualize and analyze personal expenses. The application provides interactive charts and detailed breakdowns of spending patterns across different categories and time periods.

## Features

- Interactive expense visualization with line and bar charts
- Category-based expense filtering
- Year-based filtering with multi-select capability
- Higher-level category grouping option
- Detailed expense breakdown table on chart interaction
- Total and average monthly spending calculations
- Support for JSON expense data upload

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/budget-visualizer.git
cd budget-visualizer
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Run the application:
```bash
python visualizer.py
```

2. Open your browser and navigate to `http://localhost:8050`

3. Upload your expense data file (JSON format)

## Data Format

The application expects a JSON file with the following structure:
```json
{
    "Date": "YYYY-MM-DD",
    "Description": "Expense description",
    "Category": "Expense category",
    "Final_Amount": 123.45
}
```

## Category Mapping

The application supports higher-level category grouping with the following mappings:

- Entertainment & Shopping: Entertainment, Shopping
- Transportation: Transportation, Flight
- Living: Living, Rent, Home Setup
- Others: Education, Health, Miscellaneous
- Restaurant
- Grocery
- Gift
- Investment
- Travel

## Development

To run the application in debug mode:
```bash
python visualizer.py
```

## License

[MIT License](LICENSE)