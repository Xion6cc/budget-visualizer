import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

# Set random seed for reproducibility
np.random.seed(42)

print('efwef')
# Define categories and their typical amount ranges (in GBP)
categories = {
    'Rent': (1500, 2000),
    'Grocery': (50, 300),
    'Restaurant': (20, 100),
    'Transportation': (30, 150),
    'Entertainment': (20, 200),
    'Shopping': (20, 300),
    'Travel': (200, 2000),
    'Health': (50, 500),
    'Education': (100, 1000),
    'Living': (50, 300),
    'Home Setup': (100, 1000),
    'Flight': (200, 1000),
    'Gift': (20, 200),
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
        'Rent': ['Monthly Rent', 'Rent Payment', 'Housing Rent'],
        'Grocery': ['Tesco', 'Sainsbury\'s', 'Waitrose', 'Aldi', 'Lidl'],
        'Restaurant': ['Local Restaurant', 'Pizza Express', 'Nando\'s', 'Wagamama', 'Local Pub'],
        'Transportation': ['Tube Travel', 'Bus Fare', 'Train Ticket', 'Taxi Ride', 'Uber'],
        'Entertainment': ['Cinema', 'Theatre', 'Concert', 'Museum', 'Game Purchase'],
        'Shopping': ['Amazon Purchase', 'Clothing Store', 'Electronics', 'Home Goods'],
        'Travel': ['Hotel Booking', 'Holiday Package', 'Airbnb Stay'],
        'Health': ['Pharmacy', 'Doctor Visit', 'Dental Care', 'Gym Membership'],
        'Education': ['Course Payment', 'Books', 'Online Training'],
        'Living': ['Utilities', 'Internet Bill', 'Phone Bill', 'Water Bill'],
        'Home Setup': ['Furniture', 'Home Appliance', 'Decoration'],
        'Flight': ['Flight Ticket', 'Airline Booking'],
        'Gift': ['Birthday Gift', 'Holiday Gift', 'Special Occasion'],
        'Investment': ['Stock Purchase', 'Crypto Investment', 'Savings Deposit'],
        'Miscellaneous': ['General Purchase', 'Miscellaneous Item', 'Other Expense']
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

# Save to JSON file (one transaction per line)
with open('dummy_transactions.json', 'w') as f:
    for _, row in df.iterrows():
        f.write(json.dumps(dict(row)) + '\n')

print(f"Generated {len(df)} transactions from {start_date.date()} to {end_date.date()}")
print(f"Total amount in mixed currencies:")
for curr in currencies:
    curr_total = df[df['Currency'] == curr]['Amount'].sum()
    print(f"{curr}: {curr_total:,.2f}")
print("\nCategory distribution:")
print(df['Category'].value_counts())
print("\nCurrency distribution:")
print(df['Currency'].value_counts(normalize=True)) 