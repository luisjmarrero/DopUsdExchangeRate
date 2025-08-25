import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock component until we create the actual RatesTable component
const RatesTable = () => (
  <div data-testid='rates-table'>Rates Table Component</div>
);

describe('RatesTable Component', () => {
  test('renders rates table component', () => {
    render(<RatesTable />);
    expect(screen.getByTestId('rates-table')).toBeInTheDocument();
  });
});
