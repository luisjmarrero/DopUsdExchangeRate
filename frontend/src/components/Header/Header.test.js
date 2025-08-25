import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock component until we create the actual Header component
const Header = () => <div data-testid='header'>Header Component</div>;

describe('Header Component', () => {
  test('renders header component', () => {
    render(<Header />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
