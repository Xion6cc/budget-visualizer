export interface ExpenseDetail {
  Date: string;
  Description: string;
  Category: string;
  Amount: string;
}

export interface ExpenseData {
  date: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
}

export interface ChartData {
  Time_Period: string;
  Amount: number;
  Category: string;
}

export interface LineChartData {
  Time_Period: string;
  Amount: number;
}

export interface SummaryData {
  total_spent: number;
  average_spent: number;
  currency_symbol: string;
}

export interface ApiResponse {
  line_chart: LineChartData[];
  bar_chart: ChartData[];
  summary: SummaryData;
} 