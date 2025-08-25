import React from 'react';
import { useData } from '../../contexts/DataContext';
import './ChartControls.css';

const ChartControls = React.memo(() => {
  const { allRates, visibleBanks, toggleBank } = useData();
  const banks = Array.from(new Set(allRates.map((r) => r.bank)));

  const getBankLogo = (bankName) => {
    const name = bankName.toLowerCase();
    if (name.includes('bhd')) {return '🏦';}
    if (name.includes('scotia')) {return '🏛️';}
    if (name.includes('banreservas') || name.includes('ban reservas')) {return '🏢';}
    return '🏦';
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
                <span className="bank-logo">{getBankLogo(bank)}</span>
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
