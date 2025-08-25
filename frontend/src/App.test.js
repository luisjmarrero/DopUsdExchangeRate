import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders exchange rates app', () => {
  render(<App />);
  const titleElement = screen.getByText(/DOP - USD Exchange Rates/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders light mode toggle button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/☀️ Light Mode/i);
  expect(buttonElement).toBeInTheDocument();
});

test('renders historical buy rates section', () => {
  render(<App />);
  const sectionElement = screen.getByText(/Historical USD Buy Rates/i);
  expect(sectionElement).toBeInTheDocument();
});

test('renders historical sell rates section', () => {
  render(<App />);
  const sectionElement = screen.getByText(/Historical USD Sell Rates/i);
  expect(sectionElement).toBeInTheDocument();
});
