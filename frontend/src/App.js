import logo from './logo.svg';
import './App.css';

import React, { useEffect, useState } from 'react';

function App() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'bank', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: currentPage,
      size: rowsPerPage,
      sort_by: sortConfig.key,
      order: sortConfig.direction
    });
    fetch(`http://localhost:8000/rates/all?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setRates(data.items);
        setLoading(false);
        setError(null);
        // Set total pages from API response
        setTotalPages(Math.ceil(data.total / rowsPerPage));
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [currentPage, sortConfig]);

  // Remove client-side sorting and pagination
  const currentRows = rates;
  const [totalPages, setTotalPages] = useState(1);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">DOP/USD Exchange Rates</h2>
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {loading ? (
            <div className="text-center py-5">Loading...</div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover text-center align-middle">
                <thead className="table-primary">
                  <tr>
                    <th onClick={() => requestSort('bank')} style={{ cursor: 'pointer' }}>
                      Bank {sortConfig.key === 'bank' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => requestSort('buy_rate')} style={{ cursor: 'pointer' }}>
                      Buy Rate {sortConfig.key === 'buy_rate' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => requestSort('sell_rate')} style={{ cursor: 'pointer' }}>
                      Sell Rate {sortConfig.key === 'sell_rate' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => requestSort('sync_date')} style={{ cursor: 'pointer' }}>
                      Sync Date {sortConfig.key === 'sync_date' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.bank}</td>
                      <td>{typeof row.buy_rate === 'number' ? row.buy_rate.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }) : ''}</td>
                      <td>{typeof row.sell_rate === 'number' ? row.sell_rate.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }) : ''}</td>
                      <td>{row.sync_date ? new Date(row.sync_date).toLocaleString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <nav>
                <ul className="pagination justify-content-center">
                  <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item${currentPage === i + 1 ? ' active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default App;
