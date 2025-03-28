# Budget Visualizer

A modern web application for visualizing and analyzing personal expense data with interactive charts and detailed breakdowns.

## Features

- **Interactive Data Visualization**: View your expenses through stacked bar charts and line charts
- **Multi-currency Support**: Switch between GBP, USD, EUR, and RMB with automatic conversion
- **Time Period Filtering**: Analyze expenses by month, week, or year
- **Category Filtering**: Focus on specific expense categories
- **Year Selection**: Filter data by specific years
- **Expense Details**: Click on chart segments to view detailed transaction information
- **Summary Statistics**: See total spent and average per period at a glance
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components and styling
- Recharts for interactive data visualization
- Axios for API communication

### Backend
- FastAPI (Python)
- Pandas for data processing and analysis

## Getting Started

### Prerequisites
- Node.js (v14+)
- Anaconda or Miniconda
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Xion6cc/budget-visualizer.git
   cd budget-visualizer
   ```

2. Set up the backend:
   ```bash
   # Create and activate conda environment
   conda create -n budget-viz python=3.11
   conda activate budget-viz

   # Install dependencies
   cd backend
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the backend server (make sure conda environment is activated):
   ```bash
   conda activate budget-viz
   cd backend
   uvicorn src.main:app --reload --port 8000
   ```

2. Start the frontend development server (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload Data**: Click the "UPLOAD FILE" button in the sidebar to upload your expense data (JSON or JSONL format)
2. **Filter Data**: Use the sidebar controls to filter by time period, currency, years, and categories
3. **View Charts**: Examine the line chart for trends over time and the bar chart for category breakdowns
4. **View Details**: Click on any bar segment to see detailed transactions for that category and time period

## Data Format

The application expects expense data in JSON or JSONL format with the following structure:

```json
{
  "Date": "2024-01-15",
  "Description": "Grocery shopping",
  "Category": "Grocery",
  "Amount": 45.67,
  "Currency": "GBP"
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.