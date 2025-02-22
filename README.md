# Budget Visualizer

A web-based dashboard for visualizing personal expenses, built with Dash.

## Features

- Interactive expense visualization with line and bar charts
- Flexible time period views (yearly/monthly/weekly)
- Category and year-based filtering
- Higher-level category grouping
- Multiple currency support (GBP, USD, RMB)
- Detailed transaction table on chart click (top 100 entries)

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Generate test data (optional):
```bash
python generate_dummy_data.py
```

3. Run the application:
```bash
python visualizer.py
```

4. Open `http://localhost:8050` in your browser

## Data Format

Upload a JSON file with transactions in this format:
```json
{
    "Date": "YYYY-MM-DD",
    "Description": "Expense description",
    "Category": "Expense category",
    "Final_Amount": 123.45
}
```

## Categories

Basic categories: Rent, Grocery, Restaurant, Transportation, Entertainment, Shopping, Travel, Health, Education, Living, Home Setup, Flight, Gift, Investment, Miscellaneous

Higher-level groupings:
- Entertainment & Shopping
- Transportation
- Living
- Others
- Restaurant
- Grocery
- Gift
- Investment
- Travel

## Currency Support

- GBP (Base)
- USD (1 GBP = 1.25 USD)
- RMB (1 GBP = 9.2 RMB)

## Development

To run the application in debug mode:
```bash
python visualizer.py
```

## License

[MIT License](LICENSE)