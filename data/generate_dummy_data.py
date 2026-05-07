import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

# Set random seed for reproducibility
np.random.seed(42)

# Define categories and their typical amount ranges (in GBP)
# Updated to match the budget config categories
categories = {
    'Groceries': (50, 300),
    'Dining': (20, 100),
    'Transport': (30, 150),
    'Utilities': (50, 200),
    'Entertainment': (20, 200),
    'Shopping': (20, 300),
    'Travel': (200, 2000),
    'Health': (50, 500),
    'Education': (100, 1000),
    'Investment': (500, 5000),
    'Miscellaneous': (10, 100)
}

# Currency distribution weights
currencies = ['GBP', 'USD', 'RMB']
currency_weights = [0.6, 0.3, 0.1]  # 60% GBP, 30% USD, 10% RMB

# Generate dates from 2022 to 2024
start_date = datetime(2022, 1, 1)
end_date = datetime(2024, 12, 31)
dates = []
current_date = start_date

while current_date <= end_date:
    # Add more transactions for weekends
    num_transactions = np.random.randint(2, 5) if current_date.weekday() >= 5 else np.random.randint(1, 3)
    dates.extend([current_date] * num_transactions)
    current_date += timedelta(days=1)

# Create transactions
transactions = []
for date in dates:
    # Randomly select category with different weights
    category = np.random.choice(list(categories.keys()))
    min_amount, max_amount = categories[category]
    
    # Select currency and adjust amount based on currency
    currency = np.random.choice(currencies, p=currency_weights)
    
    # Generate base amount in GBP
    base_amount = round(np.random.uniform(min_amount, max_amount), 2)
    
    # Convert amount based on currency
    if currency == 'USD':
        amount = round(base_amount * 1.25, 2)  # GBP to USD rate
    elif currency == 'RMB':
        amount = round(base_amount * 9.2, 2)   # GBP to RMB rate
    else:  # GBP
        amount = base_amount
    
    # Generate description based on category
    descriptions = {
        'Groceries': ['Tesco', 'Sainsbury\'s', 'Waitrose', 'Aldi', 'Lidl', 'Morrisons', 'Co-op'],
        'Dining': ['Local Restaurant', 'Pizza Express', 'Nando\'s', 'Wagamama', 'Local Pub', 'McDonald\'s', 'KFC'],
        'Transport': ['Tube Travel', 'Bus Fare', 'Train Ticket', 'Taxi Ride', 'Uber', 'Bike Rental', 'Parking'],
        'Utilities': ['Electricity Bill', 'Gas Bill', 'Water Bill', 'Internet Bill', 'Phone Bill', 'Council Tax'],
        'Entertainment': ['Cinema', 'Theatre', 'Concert', 'Museum', 'Game Purchase', 'Netflix', 'Spotify'],
        'Shopping': ['Amazon Purchase', 'Clothing Store', 'Electronics', 'Home Goods', 'Bookstore', 'Pharmacy'],
        'Travel': ['Hotel Booking', 'Holiday Package', 'Airbnb Stay', 'Flight Ticket', 'Car Rental'],
        'Health': ['Pharmacy', 'Doctor Visit', 'Dental Care', 'Gym Membership', 'Optician', 'Physiotherapy'],
        'Education': ['Course Payment', 'Books', 'Online Training', 'Workshop', 'Conference'],
        'Investment': ['Stock Purchase', 'Crypto Investment', 'Savings Deposit', 'Pension Contribution'],
        'Miscellaneous': ['General Purchase', 'Miscellaneous Item', 'Other Expense', 'Donation', 'Service Fee']
    }
    
    description = np.random.choice(descriptions[category])
    
    transactions.append({
        'Date': date.strftime('%Y-%m-%d'),
        'Category': category,
        'Description': description,
        'Amount': amount,
        'Currency': currency
    })

# Convert to DataFrame and sort by date
df = pd.DataFrame(transactions)
df = df.sort_values('Date')

# Save to JSONL file (one transaction per line)
with open('dummy_transactions.json', 'w') as f:
    for _, row in df.iterrows():
        f.write(json.dumps(dict(row)) + '\n')

# Generate dummy budget config file
def generate_budget_config():
    """Generate realistic monthly budget values for each category"""
    budget_config = {}
    
    # Define realistic monthly budget ranges for each category (in GBP)
    budget_ranges = {
        'Groceries': (300, 600),
        'Dining': (150, 400),
        'Transport': (100, 300),
        'Utilities': (150, 350),
        'Entertainment': (100, 300),
        'Shopping': (200, 500),
        'Travel': (500, 2000),
        'Health': (50, 200),
        'Education': (200, 800),
        'Investment': (1000, 3000),
        'Miscellaneous': (50, 200)
    }
    
    # Generate budget values for each category
    for category, (min_budget, max_budget) in budget_ranges.items():
        # Generate a realistic budget value
        budget_value = round(np.random.uniform(min_budget, max_budget), 0)
        budget_config[category] = int(budget_value)
    
    return budget_config

# Generate and save budget config
budget_config = generate_budget_config()

# Create config directory if it doesn't exist
config_dir = '../frontend/public/config'
os.makedirs(config_dir, exist_ok=True)

# Save budget config to frontend/public/config directory
budget_file_path = os.path.join(config_dir, 'budget.json')
with open(budget_file_path, 'w') as f:
    json.dump(budget_config, f, indent=2)

print(f"Generated {len(df)} transactions from {start_date.date()} to {end_date.date()}")
print(f"Total amount in mixed currencies:")
for curr in currencies:
    curr_total = df[df['Currency'] == curr]['Amount'].sum()
    print(f"{curr}: {curr_total:,.2f}")
print("\nCategory distribution:")
print(df['Category'].value_counts())
print("\nCurrency distribution:")
print(df['Currency'].value_counts(normalize=True))
print(f"\nFile saved as 'dummy_transactions.json' in JSONL format")
print("Each line contains a JSON object with: Date, Category, Description, Amount, Currency")

print(f"\n=== BUDGET CONFIG GENERATED ===")
print(f"Budget config saved as '{budget_file_path}'")
print("Monthly budget values (GBP):")
for category, budget in budget_config.items():
    print(f"  {category}: £{budget:,}")
print(f"\nTotal monthly budget: £{sum(budget_config.values()):,}") 