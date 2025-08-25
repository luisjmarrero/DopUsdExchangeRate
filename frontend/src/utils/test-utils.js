import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';

// Custom render function that includes providers
const AllTheProviders = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock data for testing
export const mockExchangeRates = [
  {
    id: 1,
    bank: 'BHD Leon',
    buy_rate: 58.5,
    sell_rate: 59.2,
    change: 0.15,
    sync_date: '2025-08-24T10:00:00Z',
  },
  {
    id: 2,
    bank: 'Scotia Bank',
    buy_rate: 58.45,
    sell_rate: 59.15,
    change: -0.1,
    sync_date: '2025-08-24T10:00:00Z',
  },
  {
    id: 3,
    bank: 'Ban Reservas',
    buy_rate: 58.6,
    sell_rate: 59.3,
    change: 0.25,
    sync_date: '2025-08-24T10:00:00Z',
  },
];

export const mockHistoricalData = [
  {
    id: 1,
    date: '2025-08-24',
    bank: 'BHD Leon',
    buy_rate: 58.5,
    sell_rate: 59.2,
    change: 0.15,
  },
  {
    id: 2,
    date: '2025-08-23',
    bank: 'BHD Leon',
    buy_rate: 58.35,
    sell_rate: 59.05,
    change: -0.2,
  },
];
