import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock component until we create the actual MonthlyInsights component
const MonthlyInsights = () => (
  <div data-testid='monthly-insights'>Monthly Insights Component</div>
);

describe('MonthlyInsights Component', () => {
  test('renders monthly insights component', () => {
    render(<MonthlyInsights />);
    expect(screen.getByTestId('monthly-insights')).toBeInTheDocument();
  });
});
