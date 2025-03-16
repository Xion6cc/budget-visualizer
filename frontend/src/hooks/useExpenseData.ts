import { useState, useCallback, useEffect } from 'react';
import { ExpenseData, ExpenseFilters, uploadFile, getExpenses, getExpenseDetails } from '../api/client';

// Default filters
const initialFilters: ExpenseFilters = {
  timePeriod: 'month',
  categories: [],
  years: [],
  currency: 'GBP',
  useHigherCategory: true,
};

export const useExpenseData = () => {
  // State
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any[] | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Fetch expense data based on current filters
  const fetchExpenseData = useCallback(async () => {
    if (!availableYears.length) return;
    
    try {
      setLoading(true);
      
      // Use selected filters or all available options if none selected
      const yearsToUse = filters.years.length ? filters.years : availableYears;
      const categoriesToUse = filters.categories.length ? filters.categories : availableCategories;
      
      const response = await getExpenses({
        ...filters,
        years: yearsToUse,
        categories: categoriesToUse
      });
      
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching expense data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters, availableYears, availableCategories]);

  // Fetch data when filters change
  useEffect(() => {
    if (availableYears.length) {
      fetchExpenseData();
    }
  }, [
    filters.timePeriod,
    filters.currency,
    filters.useHigherCategory,
    JSON.stringify(filters.categories),
    JSON.stringify(filters.years),
    fetchExpenseData,
    availableYears.length
  ]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ExpenseFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Ensure arrays are properly handled
      categories: newFilters.categories !== undefined 
        ? (Array.isArray(newFilters.categories) ? newFilters.categories : []) 
        : prev.categories,
      years: newFilters.years !== undefined 
        ? (Array.isArray(newFilters.years) ? newFilters.years : []) 
        : prev.years,
      // Always keep useHigherCategory as true
      useHigherCategory: true
    }));
    
    // Clear selected details when filters change
    setSelectedDetail(null);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setLoading(true);
      
      // Always use higher categories by default
      const response = await uploadFile(file, true, filters.timePeriod);
      
      setAvailableCategories(response.categories);
      setAvailableYears(response.years);
      
      // Set default filters
      const defaultYears = response.years.filter(year => year === 2024 || year === 2025);
      const defaultCategories = response.categories.filter(category => category !== 'Investment');
      
      setFilters(prev => ({
        ...prev,
        years: defaultYears.length ? defaultYears : response.years,
        categories: defaultCategories,
        useHigherCategory: true
      }));
      
      // Clear selected details
      setSelectedDetail(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading file');
    } finally {
      setLoading(false);
    }
  }, [filters.timePeriod]);

  // Fetch expense details for a specific category and time period
  const fetchExpenseDetails = useCallback(async (category: string, timePeriod: string) => {
    if (category && timePeriod) {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching details for ${category} in ${timePeriod}`);
        
        const details = await getExpenseDetails(
          category, 
          timePeriod, 
          filters.currency, 
          filters.useHigherCategory
        );
        console.log('Fetched details:', details);
        
        setSelectedDetail(details);
      } catch (error) {
        console.error('Error fetching expense details:', error);
        setError(`Error fetching expense details: ${error instanceof Error ? error.message : String(error)}`);
        setSelectedDetail([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedDetail([]);
    }
  }, [filters]);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    handleFileUpload,
    selectedDetail,
    fetchExpenseDetails,
    availableCategories,
    availableYears,
  };
}; 