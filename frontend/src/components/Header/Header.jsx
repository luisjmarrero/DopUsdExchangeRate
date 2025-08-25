import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import './Header.css';

const Header = React.memo(() => {
  const { darkMode, toggleTheme } = useTheme();
  const { lastUpdated } = useData();

  const formatDate = dateString => {
    if (!dateString) {
      return 'Not available';
    }

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <header className='header'>
      <div className='container'>
        <div className='row align-items-center'>
          <div className='col-md-6'>
            <h1 className='header-title'>
              <i className='fas fa-chart-line me-2'></i>
              DOP - USD Exchange Rates
            </h1>
          </div>
          <div className='col-md-6 text-end'>
            <div className='header-controls'>
               <div className='last-updated me-3'>
                 <small>
                   Last updated: {formatDate(lastUpdated)}
                 </small>
               </div>
              <div className="theme-toggle-container">
                <label className="theme-toggle-switch" htmlFor="theme-toggle">
                  <input
                    type="checkbox"
                    id="theme-toggle"
                    checked={darkMode}
                    onChange={toggleTheme}
                    aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                  />
                  <span className="toggle-slider">
                    <span className="toggle-icon toggle-icon-light">☀️</span>
                    <span className="toggle-icon toggle-icon-dark">🌙</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
