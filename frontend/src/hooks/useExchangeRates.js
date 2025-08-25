import { useData } from '../contexts/DataContext';

export const useExchangeRates = () => {
  const data = useData();
  
  // Get current rates with loading state
  const getCurrentRates = () => ({
    rates: data.rates,
    loading: data.loading,
    error: data.error,
    lastUpdated: data.lastUpdated,
  });
  
  // Get historical rates for charts
  const getHistoricalRates = () => ({
    allRates: data.allRates,
    loading: data.graphLoading,
    error: data.graphError,
  });
  
  // Get visible banks for charts
  const getVisibleBanks = () => ({
    visibleBanks: data.visibleBanks,
    allBanks: data.banks,
  });
  
  // Get filtered data
  const getFilteredData = (filters) => {
    return data.filterData(filters);
  };
  
  // Export functions
  const exportData = {
    toCSV: data.exportToCSV,
    toXLSX: data.exportToXLSX,
  };
  
  // Bank visibility controls
  const bankControls = {
    toggleBank: data.toggleBank,
    visibleBanks: data.visibleBanks,
    allBanks: data.banks,
  };
  
  // Refresh functions
  const refresh = {
    currentRates: data.fetchCurrentRates,
    historicalRates: data.fetchAllRates,
  };
  
  return {
    // Current rates
    ...getCurrentRates(),
    
    // Historical data
    ...getHistoricalRates(),
    
    // Bank controls
    ...bankControls,
    
    // Filtering
    getFilteredData,
    
    // Export
    exportData,
    
    // Refresh
    refresh,
    
    // Raw data access
    raw: data,
  };
};
