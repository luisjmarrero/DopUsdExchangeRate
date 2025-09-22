import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import './MonthlyInsights.css';

const MonthlyInsights = React.memo(() => {
  const { allRates, banks, bankFavicons } = useData();
  const [selectedBank, setSelectedBank] = useState('all');
  const [availableBanks, setAvailableBanks] = useState([]);

  // Update available banks when banks data changes
  useEffect(() => {
    setAvailableBanks(banks.sort());
  }, [banks]);

  const handleBankChange = (e) => {
    setSelectedBank(e.target.value);
  };

  const rates = allRates;
  const getCurrentMonthData = () => {
    if (!rates || rates.length === 0) {
      return null;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let monthRates = rates.filter(rate => {
      const rateDate = new Date(rate.sync_date);
      return (
        rateDate.getMonth() === currentMonth &&
        rateDate.getFullYear() === currentYear
      );
    });

    // Filter by selected bank if not 'all'
    if (selectedBank !== 'all') {
      monthRates = monthRates.filter(rate => rate.bank === selectedBank);
    }

    if (monthRates.length === 0) {
      return null;
    }

    const buyRates = monthRates.map(r => r.buy_rate).filter(Boolean);
    const sellRates = monthRates.map(r => r.sell_rate).filter(Boolean);

    const buyAverage = buyRates.length > 0 ? buyRates.reduce((sum, rate) => sum + rate, 0) / buyRates.length : 0;
    const sellAverage = sellRates.length > 0 ? sellRates.reduce((sum, rate) => sum + rate, 0) / sellRates.length : 0;

    return {
      buy: {
        highest: Math.max(...buyRates),
        lowest: Math.min(...buyRates),
        average: buyAverage,
      },
      sell: {
        highest: Math.max(...sellRates),
        lowest: Math.min(...sellRates),
        average: sellAverage,
      },
    };
  };

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

  const monthData = getCurrentMonthData();
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  const getTitle = () => {
    const baseTitle = `${monthName} Insights`;
    if (selectedBank === 'all') {
      return baseTitle;
    }
    return `${baseTitle} - ${selectedBank}`;
  };

  if (!monthData) {
    return (
      <div className='monthly-insights-container'>
        <div className="monthly-insights-header">
          <h4 className='mb-3'>{getTitle()}</h4>

          {/* Bank Selector */}
          <div className="bank-selector-container">
            <label htmlFor="bankSelector" className="form-label bank-selector-label">
              Bank
            </label>
            <select
              id="bankSelector"
              className="form-select bank-selector"
              value={selectedBank}
              onChange={handleBankChange}
            >
              <option value="all">All Banks</option>
              {availableBanks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className='text-center py-4'>
          <p className='text-muted'>
            No data available for {monthName}
            {selectedBank !== 'all' && ` from ${selectedBank}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='monthly-insights-container'>
      <div className="monthly-insights-header">
        <h4 className='mb-3'>{getTitle()}</h4>

        {/* Bank Selector */}
        <div className="bank-selector-container">
          <label htmlFor="bankSelector" className="form-label bank-selector-label">
            Bank
          </label>
          <select
            id="bankSelector"
            className="form-select bank-selector"
            value={selectedBank}
            onChange={handleBankChange}
          >
            <option value="all">All Banks</option>
            {availableBanks.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='row'>
        {/* Buy Rates */}
        <div className='col-6'>
          <div className='insight-card buy-insights'>
            <h6 className='insight-title'>Buy Rates</h6>
            <div className='insight-item'>
              <span className='insight-label'>Highest:</span>
              <span className='insight-value highest'>
                ${monthData.buy.highest.toFixed(2)}
              </span>
            </div>
            <div className='insight-item'>
              <span className='insight-label'>Lowest:</span>
              <span className='insight-value lowest'>
                ${monthData.buy.lowest.toFixed(2)}
              </span>
            </div>
            <div className='insight-item'>
              <span className='insight-label'>Average:</span>
              <span className='insight-value average'>
                ${monthData.buy.average.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Sell Rates */}
        <div className='col-6'>
          <div className='insight-card sell-insights'>
            <h6 className='insight-title'>Sell Rates</h6>
            <div className='insight-item'>
              <span className='insight-label'>Highest:</span>
              <span className='insight-value highest'>
                ${monthData.sell.highest.toFixed(2)}
              </span>
            </div>
            <div className='insight-item'>
              <span className='insight-label'>Lowest:</span>
              <span className='insight-value lowest'>
                ${monthData.sell.lowest.toFixed(2)}
              </span>
            </div>
            <div className='insight-item'>
              <span className='insight-label'>Average:</span>
              <span className='insight-value average'>
                ${monthData.sell.average.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MonthlyInsights.displayName = 'MonthlyInsights';

export default MonthlyInsights;
