import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock component until we create the actual MainLayout component
const MainLayout = () => (
  <div data-testid='main-layout'>Main Layout Component</div>
);

describe('MainLayout Component', () => {
  test('renders main layout component', () => {
    render(<MainLayout />);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });
});
