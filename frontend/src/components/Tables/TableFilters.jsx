import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import './TableFilters.css';

const TableFilters = React.memo(() => {
  const { allRates, tableFilters, updateTableFilters, clearTableFilters, bankFavicons } = useData();
  const [availableBanks, setAvailableBanks] = useState([]);

  useEffect(() => {
    // Extract unique banks from the data
    const banks = Array.from(new Set(allRates.map((r) => r.bank))).sort();
    setAvailableBanks(banks);
  }, [allRates]);

  const handleBankChange = (e) => {
    const bankValue = e.target.value;
    updateTableFilters({
      ...tableFilters,
      bank: bankValue === 'all' ? null : bankValue,
    });
  };

  const handleStartDateChange = (e) => {
    updateTableFilters({
      ...tableFilters,
      startDate: e.target.value || null,
    });
  };

  const handleEndDateChange = (e) => {
    updateTableFilters({
      ...tableFilters,
      endDate: e.target.value || null,
    });
  };

  const handleClearFilters = () => {
    clearTableFilters();
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

  const hasActiveFilters = tableFilters.bank || tableFilters.startDate || tableFilters.endDate;

  return (
    <div className="table-filters-container">
      <h5 className="filters-title">Filters</h5>
      
      <div className="filters-form">
        <div className="row">
          {/* Bank Filter */}
          <div className="col-md-4 mb-3">
            <label htmlFor="bankFilter" className="form-label">
              Bank
            </label>
            <select
              id="bankFilter"
              className="form-select"
              value={tableFilters.bank || 'all'}
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

          {/* Start Date Filter */}
          <div className="col-md-4 mb-3">
            <label htmlFor="startDate" className="form-label">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="form-control"
              value={tableFilters.startDate || ''}
              onChange={handleStartDateChange}
              max={tableFilters.endDate || undefined}
            />
          </div>

          {/* End Date Filter */}
          <div className="col-md-4 mb-3">
            <label htmlFor="endDate" className="form-label">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="form-control"
              value={tableFilters.endDate || ''}
              onChange={handleEndDateChange}
              min={tableFilters.startDate || undefined}
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="filters-actions">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </button>
          
            {hasActiveFilters && (
             <div className="active-filters-info">
               <small className="text-muted">
                 Active filters: {tableFilters.bank && `Bank: ${tableFilters.bank}`}
                 {tableFilters.startDate && `, From: ${new Date(tableFilters.startDate).toLocaleDateString()}`}
                 {tableFilters.endDate && `, To: ${new Date(tableFilters.endDate).toLocaleDateString()}`}
               </small>
             </div>
           )}
        </div>
      </div>
    </div>
  );
});

TableFilters.displayName = 'TableFilters';

export default TableFilters;
