import React from 'react';
import { useData } from '../../contexts/DataContext';
import './ChartControls.css';

const ChartControls = React.memo(() => {
  const { allRates, visibleBanks, toggleBank, bankFavicons } = useData();
  const banks = Array.from(new Set(allRates.map((r) => r.bank)));

  const getBankIcon = (bankName) => {
    const faviconUrl = bankFavicons[bankName];

    // Determine emoji fallback
    const name = bankName.toLowerCase();
    let emoji = '🏦'; // default
    if (name.includes('bhd')) {
      emoji = '🏦';
    } else if (name.includes('scotia')) {
      emoji = '🏛️';
    } else if (name.includes('banreservas') || name.includes('ban reservas')) {
      emoji = '🏢';
    }

    if (faviconUrl) {
      return (
        <span className="bank-icon-container">
          <img
            src={faviconUrl}
            alt={`${bankName} logo`}
            className="bank-favicon"
            style={{ width: '16px', height: '16px', marginRight: '4px' }}
            onError={(e) => {
              // Hide favicon and show emoji on error
              e.target.style.display = 'none';
              const emojiSpan = e.target.parentElement.querySelector('.bank-emoji');
              if (emojiSpan) {
                emojiSpan.style.display = 'inline';
              }
            }}
            onLoad={(e) => {
              // Hide emoji when favicon loads successfully
              const emojiSpan = e.target.parentElement.querySelector('.bank-emoji');
              if (emojiSpan) {
                emojiSpan.style.display = 'none';
              }
            }}
          />
          <span className="bank-emoji" style={{ display: 'none' }}>{emoji}</span>
        </span>
      );
    }

    // No favicon available, just show emoji
    return <span className="bank-emoji">{emoji}</span>;
  };

  const getBankColor = (bankName) => {
    const name = bankName.toLowerCase();
    if (name.includes('bhd')) {return '#198754';}
    if (name.includes('scotia')) {return '#dc3545';}
    if (name.includes('banreservas') || name.includes('ban reservas')) {return '#0dcaf0';}
    return '#6c757d';
  };

  if (!banks || banks.length === 0) {
    return (
      <div className="chart-controls-container">
        <p className="text-muted">No banks available</p>
      </div>
    );
  }

  return (
    <div className="chart-controls-container">
      <h6 className="controls-title">Bank Visibility</h6>
      <div className="bank-toggles">
        {banks.map((bank) => {
          const isVisible = visibleBanks.includes(bank);
          const bankColor = getBankColor(bank);
          
          return (
            <div key={bank} className="bank-toggle-item">
              <button
                className={`bank-toggle-btn ${isVisible ? 'active' : 'inactive'}`}
                onClick={() => toggleBank(bank)}
                style={{
                  '--bank-color': bankColor,
                }}
                aria-label={`${isVisible ? 'Hide' : 'Show'} ${bank} data`}
              >
                 <span className="bank-logo">{getBankIcon(bank)}</span>
                <span className="bank-name">{bank}</span>
                <span className="toggle-indicator">
                  {isVisible ? '👁️' : '🙈'}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      
      <div className="controls-actions mt-3">
        <button
          className="btn btn-sm btn-outline-secondary me-2"
          onClick={() => toggleBank('all')}
        >
          Show All
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => toggleBank('none')}
        >
          Hide All
        </button>
      </div>
    </div>
  );
});

ChartControls.displayName = 'ChartControls';

export default ChartControls;
