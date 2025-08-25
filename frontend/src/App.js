import React from 'react';
import './App.css';

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';

// Components
import Header from './components/Header';
import MainLayout from './components/Layout/MainLayout';
import RatesTable from './components/Dashboard/RatesTable';
import MonthlyInsights from './components/Dashboard/MonthlyInsights';
import CurrencyCalculator from './components/Dashboard/CurrencyCalculator';
import ExchangeRateCharts from './components/Charts/ExchangeRateCharts';
import ChartControls from './components/Charts/ChartControls';
import TableFilters from './components/Tables/TableFilters';
import HistoricalTable from './components/Tables/HistoricalTable';

// Main App Component
function AppContent() {
  return (
    <div className="App">
      <Header />
      <MainLayout
        leftColumn={
           <>
             <RatesTable />
             <MonthlyInsights />
             <CurrencyCalculator />
           </>
         }
        rightColumn={
          <>
            <ExchangeRateCharts />
            <ChartControls />
          </>
        }
      >
        <TableFilters />
        <HistoricalTable />
      </MainLayout>
    </div>
  );
}

// App with Providers
function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
