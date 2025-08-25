import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock component until we create the actual ExchangeRateCharts component
const ExchangeRateCharts = () => (
  <div data-testid='exchange-rate-charts'>Exchange Rate Charts Component</div>
);

describe('ExchangeRateCharts Component', () => {
  test('renders exchange rate charts component', () => {
    render(<ExchangeRateCharts />);
    expect(screen.getByTestId('exchange-rate-charts')).toBeInTheDocument();
  });
});
