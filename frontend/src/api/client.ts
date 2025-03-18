import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

export interface ExpenseFilters {
  timePeriod: string;
  categories: string[];
  years: number[];
  currency: string;
  useHigherCategory: boolean;
}

export interface ChartDataPoint {
  timePeriod: string;
  category: string;
  amount: number;
}

export interface ExpenseData {
  barChartData: ChartDataPoint[];
}

export interface ExpenseDetail {
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface UploadResponse {
  message: string;
  categories: string[];
  years: number[];
}

const api = axios.create({
  baseURL: BASE_URL,
});

export const uploadFile = async (
  file: File,
  useHigherCategory: boolean = false,
  timePeriod: string = 'month'
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const url = new URL(`${BASE_URL}/expenses/upload`);
  url.searchParams.append('use_higher_category', useHigherCategory.toString());
  url.searchParams.append('time_period', timePeriod);
  
  console.log('Uploading file to:', url.toString());
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload error:', errorText);
    throw new Error(`Error uploading file: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
};

export const getExpenses = async (filters: ExpenseFilters): Promise<ExpenseData> => {
  const url = new URL(`${BASE_URL}/expenses`);
  
  // Add query parameters
  url.searchParams.append('time_period', filters.timePeriod);
  url.searchParams.append('currency', filters.currency);
  url.searchParams.append('use_higher_category', filters.useHigherCategory.toString());
  
  // Add categories as multiple parameters
  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach(category => {
      url.searchParams.append('categories', category);
    });
  }
  
  // Add years as multiple parameters
  if (filters.years && filters.years.length > 0) {
    filters.years.forEach(year => {
      url.searchParams.append('years', year.toString());
    });
  }
  
  console.log('Fetching expenses from:', url.toString());
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API error:', errorText);
    throw new Error(`Error fetching expenses: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
};

export const getExpenseDetails = async (
  category: string,
  timePeriod: string,
  currency: string = 'GBP',
  useHigherCategory: boolean = false
): Promise<ExpenseDetail[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/expenses/details?category=${encodeURIComponent(category)}&time_period=${encodeURIComponent(timePeriod)}&currency=${currency}&use_higher_category=${useHigherCategory}`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching expense details: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.details;
  } catch (error) {
    console.error('Error fetching expense details:', error);
    throw error;
  }
};

export default api; 