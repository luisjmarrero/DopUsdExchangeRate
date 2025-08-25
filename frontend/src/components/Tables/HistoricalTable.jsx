import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import './HistoricalTable.css';

const HistoricalTable = React.memo(() => {
  const { allRates, filteredAllRates, exportData } = useData();
  const data = filteredAllRates;
  const [sortConfig, setSortConfig] = useState({
    key: 'sync_date',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting function
  const sortedData = useMemo(() => {
    const sortableData = [...data];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle date sorting
        if (sortConfig.key === 'sync_date') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        // Handle numeric sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }

        // Handle string sorting
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (validCurrentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  // Reset to first page when data changes (due to filtering)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  // Reset to first page when rows per page changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) {return 'N/A';}
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format change indicator
  const formatChange = (change, type = 'buy') => {
    // If change is falsy (null, undefined, etc.), display as white (N/A)
    if (!change && change !== 0) {
      return (
        <span className="change-indicator change-neutral">
          N/A
        </span>
      );
    }

    // If change is exactly 0, display as white
    if (change === 0) {
      return (
        <span className="change-indicator change-neutral">
          0.00
        </span>
      );
    }

    if (type === 'sell') {
      // Sell change: green if > 0, red if < 0
      const isPositive = change > 0;
      const sign = change > 0 ? '+' : '';
      const className = isPositive ? 'change-positive' : 'change-negative';
      return (
        <span className={`change-indicator ${className}`}>
          {sign}{change.toFixed(2)}
        </span>
      );
    } else {
      // Buy change: red if > 0, green if < 0
      const isPositive = change > 0;
      const sign = change > 0 ? '+' : '';
      const className = isPositive ? 'change-negative' : 'change-positive';
      return (
        <span className={`change-indicator ${className}`}>
          {sign}{change.toFixed(2)}
        </span>
      );
    }
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {return '↕️';}
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (!data || data.length === 0) {
    return (
      <div className="historical-table-container">
        <div className="table-header">
          <h4>Historical Exchange Rates</h4>
          <div className="table-actions">
            <button className="btn btn-outline-secondary btn-sm" disabled>
              Export CSV
            </button>
            <button className="btn btn-outline-secondary btn-sm" disabled>
              Export XLSX
            </button>
          </div>
        </div>
        <div className="text-center py-4">
          <p className="text-muted">No historical data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historical-table-container">
      <div className="table-header">
        <h4>Historical Exchange Rates</h4>
        <div className="table-actions">
          <button 
            className="btn btn-outline-secondary btn-sm me-2"
            onClick={() => exportData.toCSV(sortedData)}
          >
            Export CSV
          </button>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => exportData.toXLSX(sortedData)}
          >
            Export XLSX
          </button>
        </div>
      </div>

      <div className="table-responsive">
         <table className="table table-hover">
           <thead>
            <tr>
              <th 
                className="sortable-header"
                onClick={() => handleSort('sync_date')}
              >
                Date {getSortIndicator('sync_date')}
              </th>
              <th 
                className="sortable-header"
                onClick={() => handleSort('bank')}
              >
                Bank {getSortIndicator('bank')}
              </th>
              <th 
                className="sortable-header text-end"
                onClick={() => handleSort('buy_rate')}
              >
                Buy Rate {getSortIndicator('buy_rate')}
              </th>
              <th 
                className="sortable-header text-end"
                onClick={() => handleSort('buy_change')}
              >
                Buy Change {getSortIndicator('buy_change')}
              </th>
              <th 
                className="sortable-header text-end"
                onClick={() => handleSort('sell_rate')}
              >
                Sell Rate {getSortIndicator('sell_rate')}
              </th>
              <th 
                className="sortable-header text-end"
                onClick={() => handleSort('sell_change')}
              >
                Sell Change {getSortIndicator('sell_change')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr key={row.id || `${row.bank}-${row.sync_date}-${index}`}>
                <td>{formatDate(row.sync_date)}</td>
                <td>
                  <div className="bank-info">
                    <span className="bank-logo me-2">
                      {row.bank?.toLowerCase().includes('bhd') ? '🏦' : 
                       row.bank?.toLowerCase().includes('scotia') ? '🏛️' : 
                       row.bank?.toLowerCase().includes('banreservas') ? '🏢' : '🏦'}
                    </span>
                    <span className="bank-name">{row.bank}</span>
                  </div>
                </td>
                <td className="text-end">
                  <span className="rate-value buy-rate">
                    ${row.buy_rate?.toFixed(2) || 'N/A'}
                  </span>
                </td>
                <td className="text-end">
                  {formatChange(row.buy_change, 'buy')}
                </td>
                <td className="text-end">
                  <span className="rate-value sell-rate">
                    ${row.sell_rate?.toFixed(2) || 'N/A'}
                  </span>
                </td>
                <td className="text-end">
                  {formatChange(row.sell_change, 'sell')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedData.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} entries
            </div>
            <div className="rows-per-page-selector">
              <label htmlFor="rowsPerPage" className="form-label me-2">
                Show:
              </label>
              <select
                id="rowsPerPage"
                className="form-select form-select-sm"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                style={{ width: 'auto', display: 'inline-block' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="ms-2">entries</span>
            </div>
          </div>
          {totalPages > 1 && (
            <nav aria-label="Table pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${validCurrentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(validCurrentPage - 1)}
                    disabled={validCurrentPage === 1}
                  >
                    Previous
                  </button>
                </li>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page} className={`page-item ${page === validCurrentPage ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${validCurrentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(validCurrentPage + 1)}
                    disabled={validCurrentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      )}
    </div>
  );
});

HistoricalTable.displayName = 'HistoricalTable';

export default HistoricalTable;
