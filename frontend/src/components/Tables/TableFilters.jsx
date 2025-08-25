import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import './TableFilters.css';

const TableFilters = React.memo(() => {
  const { allRates, tableFilters, updateTableFilters, clearTableFilters } = useData();
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

  const getBankLogo = (bankName) => {
    const name = bankName.toLowerCase();
    if (name.includes('bhd')) {return '🏦';}
    if (name.includes('scotia')) {return '🏛️';}
    if (name.includes('banreservas') || name.includes('ban reservas')) {return '🏢';}
    return '🏦';
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
                  {getBankLogo(bank)} {bank}
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
