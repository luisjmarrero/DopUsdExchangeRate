import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataProvider } from '../../contexts/DataContext';
import CurrencyCalculator from './CurrencyCalculator';

// Mock the DataContext
const mockRates = [
  {
    bank: 'Test Bank',
    buy_rate: 58.50,
    sell_rate: 59.25,
    sync_date: '2024-01-01T00:00:00Z'
  }
];

const renderWithContext = (component, rates = mockRates) => {
  return render(
    <DataProvider>
      {component}
    </DataProvider>
  );
};

describe('CurrencyCalculator', () => {
  beforeEach(() => {
    // Mock the fetch functions to avoid actual API calls
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRates)
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders currency calculator title', () => {
    renderWithContext(<CurrencyCalculator />);
    expect(screen.getByText('Currency Calculator')).toBeInTheDocument();
  });

  test('displays no rates message when no data available', () => {
    renderWithContext(<CurrencyCalculator />, []);
    expect(screen.getByText('No exchange rates available')).toBeInTheDocument();
  });

  test('renders input field for amount', () => {
    renderWithContext(<CurrencyCalculator />);
    const amountInput = screen.getByPlaceholderText(/Enter amount in/);
    expect(amountInput).toBeInTheDocument();
  });

  test('renders bank selection when multiple banks available', () => {
    const multipleBanks = [
      { bank: 'Bank A', buy_rate: 58.50, sell_rate: 59.25, sync_date: '2024-01-01T00:00:00Z' },
      { bank: 'Bank B', buy_rate: 58.75, sell_rate: 59.50, sync_date: '2024-01-01T00:00:00Z' }
    ];
    renderWithContext(<CurrencyCalculator />, multipleBanks);
    expect(screen.getByLabelText('Bank')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bank A')).toBeInTheDocument();
  });

  test('does not render bank selection when only one bank available', () => {
    renderWithContext(<CurrencyCalculator />);
    expect(screen.queryByLabelText('Bank')).not.toBeInTheDocument();
  });

  test('renders currency selection dropdowns', () => {
    renderWithContext(<CurrencyCalculator />);
    expect(screen.getByDisplayValue('DOP')).toBeInTheDocument();
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
  });

  test('renders rate type buttons', () => {
    renderWithContext(<CurrencyCalculator />);
    expect(screen.getByText('Buy Rate')).toBeInTheDocument();
    expect(screen.getByText('Sell Rate')).toBeInTheDocument();
  });

  test('allows amount input', () => {
    renderWithContext(<CurrencyCalculator />);
    const amountInput = screen.getByPlaceholderText(/Enter amount in/);
    fireEvent.change(amountInput, { target: { value: '1000' } });
    expect(amountInput.value).toBe('1000');
  });

  test('prevents invalid amount input', () => {
    renderWithContext(<CurrencyCalculator />);
    const amountInput = screen.getByPlaceholderText(/Enter amount in/);
    fireEvent.change(amountInput, { target: { value: 'abc' } });
    expect(amountInput.value).toBe('');
  });

  test('allows decimal amount input', () => {
    renderWithContext(<CurrencyCalculator />);
    const amountInput = screen.getByPlaceholderText(/Enter amount in/);
    fireEvent.change(amountInput, { target: { value: '100.50' } });
    expect(amountInput.value).toBe('100.50');
  });

  test('swaps currencies when swap button is clicked', () => {
    renderWithContext(<CurrencyCalculator />);
    const swapButton = screen.getByTitle('Swap currencies');

    // Initial state: DOP to USD
    expect(screen.getByDisplayValue('DOP')).toBeInTheDocument();
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();

    fireEvent.click(swapButton);

    // After swap: USD to DOP
    expect(screen.getAllByDisplayValue('USD')).toHaveLength(1);
    expect(screen.getAllByDisplayValue('DOP')).toHaveLength(1);
  });

  test('changes rate type when buttons are clicked', () => {
    renderWithContext(<CurrencyCalculator />);
    const sellRateButton = screen.getByText('Sell Rate');

    fireEvent.click(sellRateButton);

    // The button should now be active (primary style)
    expect(sellRateButton).toHaveClass('btn-primary');
  });

  test('displays exchange rate information', () => {
    renderWithContext(<CurrencyCalculator />);
    expect(screen.getByText('Exchange Rate:')).toBeInTheDocument();
    expect(screen.getByText('Converted Amount:')).toBeInTheDocument();
  });

  test('shows rate explanation text', () => {
    renderWithContext(<CurrencyCalculator />);
    expect(screen.getByText(/Using buy rate/)).toBeInTheDocument();
  });
});