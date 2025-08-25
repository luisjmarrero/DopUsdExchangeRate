import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [rates, setRates] = useState([]);
  const [allRates, setAllRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState(null);
  const [visibleBanks, setVisibleBanks] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filter state for historical table
  const [tableFilters, setTableFilters] = useState({
    bank: null,
    startDate: null,
    endDate: null,
  });

  // Fetch current rates
  const fetchCurrentRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = `${process.env.REACT_APP_API_URL}/rates`;
      console.log('Fetching current rates from:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch current rates: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received rates data:', data);
      setRates(data);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching current rates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all historical rates for charts
  const fetchAllRates = useCallback(async () => {
    try {
      setGraphLoading(true);
      setGraphError(null);
      
      let all = [];
      let page = 1;
      const size = 100;
      let totalPages = 1;
      
      do {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/rates/all?page=${page}&size=${size}&sort_by=sync_date&order=asc`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch historical rates');
        }
        
        const data = await response.json();
        all = all.concat(data.items || data);
        totalPages = data.pages || 1;
        page++;
      } while (page <= totalPages);
      
      setAllRates(all);
      
      // Set visible banks on first load
      if (visibleBanks.length === 0 && all.length > 0) {
        const banks = Array.from(new Set(all.map(r => r.bank)));
        setVisibleBanks(banks);
      }
      
      setGraphError(null);
    } catch (err) {
      setGraphError(err.message);
      console.error('Error fetching historical rates:', err);
    } finally {
      setGraphLoading(false);
    }
  }, [visibleBanks.length]);

  // Toggle bank visibility
  const toggleBank = useCallback((bank) => {
    if (bank === 'all') {
      const allBanks = Array.from(new Set(allRates.map(r => r.bank)));
      setVisibleBanks(allBanks);
    } else if (bank === 'none') {
      setVisibleBanks([]);
    } else {
      setVisibleBanks(prev => 
        prev.includes(bank) 
          ? prev.filter(b => b !== bank)
          : [...prev, bank]
      );
    }
  }, [allRates]);

  // Filter data based on criteria
  const filterData = useCallback((filters) => {
    let filtered = [...allRates];

    if (filters.bank) {
      filtered = filtered.filter(r => r.bank === filters.bank);
    }

    if (filters.startDate) {
      filtered = filtered.filter(r => new Date(r.sync_date) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter(r => new Date(r.sync_date) <= new Date(filters.endDate));
    }

    return filtered;
  }, [allRates]);

  // Update table filters
  const updateTableFilters = useCallback((filters) => {
    setTableFilters(filters);
  }, []);

  // Clear table filters
  const clearTableFilters = useCallback(() => {
    setTableFilters({
      bank: null,
      startDate: null,
      endDate: null,
    });
  }, []);

  // Computed filtered data for historical table
  const filteredAllRates = useMemo(() => {
    return filterData(tableFilters);
  }, [filterData, tableFilters]);

  // Export data functions
  const exportToCSV = useCallback((data, filename = 'exchange_rates.csv') => {
    if (!data || data.length === 0) {return;}
    
    const headers = ['Date', 'Bank', 'Buy Rate', 'Sell Rate', 'Change'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        new Date(row.sync_date).toLocaleDateString(),
        row.bank,
        row.buy_rate,
        row.sell_rate,
        row.change
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportToXLSX = useCallback((data, filename = 'exchange_rates.xlsx') => {
    // For now, we'll use CSV export as XLSX requires additional libraries
    // In a real implementation, you'd use a library like 'xlsx' or 'exceljs'
    exportToCSV(data, filename.replace('.xlsx', '.csv'));
  }, [exportToCSV]);

  // Initial data fetch
  useEffect(() => {
    console.log('DataContext: Initial data fetch started');
    console.log('API URL:', process.env.REACT_APP_API_URL);
    fetchCurrentRates();
    fetchAllRates();
  }, [fetchCurrentRates, fetchAllRates]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentRates();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchCurrentRates]);

  const value = {
    // State
    rates,
    allRates,
    loading,
    error,
    graphLoading,
    graphError,
    visibleBanks,
    lastUpdated,
    tableFilters,

    // Actions
    fetchCurrentRates,
    fetchAllRates,
    toggleBank,
    filterData,
    updateTableFilters,
    clearTableFilters,
    exportToCSV,
    exportToXLSX,

    // Computed values
    banks: Array.from(new Set(allRates.map(r => r.bank))),
    filteredAllRates,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
