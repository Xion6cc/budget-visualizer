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
- Multiple currency support (GBP, USD, RMB)

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

### Generate Test Data (Optional)
1. Generate dummy data for testing:
```bash
python generate_dummy_data.py
```
This will create a `dummy_transactions.json` file with sample transactions from 2022 to 2024.

### Run the Application
1. Start the application:
```bash
python visualizer.py
```

2. Open your browser and navigate to `http://localhost:8050`

3. Upload your expense data file:
   - Use the generated `dummy_transactions.json` for testing
   - Or upload your own JSON file

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

## Supported Categories

The application recognizes the following expense categories:
- Rent
- Grocery
- Restaurant
- Transportation
- Entertainment
- Shopping
- Travel
- Health
- Education
- Living
- Home Setup
- Flight
- Gift
- Investment
- Miscellaneous

### Higher-Level Category Grouping

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

## Currency Support

The application supports multiple currencies:
- GBP (British Pound) - Default
- USD (US Dollar) - Rate: 1 GBP = 1.25 USD
- RMB (Chinese Yuan) - Rate: 1 GBP = 9.2 RMB

## Development

To run the application in debug mode:
```bash
python visualizer.py
```

## License

[MIT License](LICENSE)