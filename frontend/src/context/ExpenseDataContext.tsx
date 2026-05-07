import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ExpenseData, ExpenseFilters, uploadFile, getExpenses, getExpenseDetails } from '../api/client';

const initialFilters: ExpenseFilters = {
  timePeriod: 'month',
  categories: [],
  years: [],
  currency: 'GBP',
  useHigherCategory: true,
};

const ExpenseDataContext = createContext<any>(null);

export const ExpenseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any[] | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const fetchExpenseData = useCallback(async () => {
    if (!availableYears.length) return;
    try {
      setLoading(true);
      const yearsToUse = filters.years.length ? filters.years : availableYears;
      const categoriesToUse = filters.categories.length ? filters.categories : availableCategories;
      const response = await getExpenses({ ...filters, years: yearsToUse, categories: categoriesToUse });
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching expense data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters, availableYears, availableCategories]);

  useEffect(() => {
    if (availableYears.length) {
      fetchExpenseData();
    }
  }, [filters.timePeriod, filters.currency, filters.useHigherCategory, JSON.stringify(filters.categories), JSON.stringify(filters.years), fetchExpenseData, availableYears.length]);

  const updateFilters = useCallback((newFilters: Partial<ExpenseFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      categories: newFilters.categories !== undefined ? (Array.isArray(newFilters.categories) ? newFilters.categories : []) : prev.categories,
      years: newFilters.years !== undefined ? (Array.isArray(newFilters.years) ? newFilters.years : []) : prev.years,
      useHigherCategory: true
    }));
    setSelectedDetail(null);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setLoading(true);
      const response = await uploadFile(file, true, filters.timePeriod);
      setAvailableCategories(response.categories);
      setAvailableYears(response.years);
      const sortedYears = [...response.years].sort((a, b) => b - a);
      const defaultYears = sortedYears.slice(0, 2);
      const defaultCategories = response.categories.filter(category => category !== 'Investment');
      setFilters(prev => ({
        ...prev,
        years: defaultYears.length ? defaultYears : response.years,
        categories: defaultCategories,
        useHigherCategory: true
      }));
      setSelectedDetail(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading file');
    } finally {
      setLoading(false);
    }
  }, [filters.timePeriod]);

  const fetchExpenseDetails = useCallback(async (category: string, timePeriod: string) => {
    if (category && timePeriod) {
      setLoading(true);
      setError(null);
      try {
        const details = await getExpenseDetails(category, timePeriod, filters.currency, filters.useHigherCategory);
        setSelectedDetail(details);
      } catch (error) {
        setError(`Error fetching expense details: ${error instanceof Error ? error.message : String(error)}`);
        setSelectedDetail([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedDetail([]);
    }
  }, [filters]);

  return (
    <ExpenseDataContext.Provider value={{
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
    }}>
      {children}
    </ExpenseDataContext.Provider>
  );
};

export const useExpenseDataContext = () => useContext(ExpenseDataContext); 