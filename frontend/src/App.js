import logo from './logo.svg';
import './App.css';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';

function App() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    // Try to read from localStorage
    const stored = window.localStorage.getItem('darkMode');
    return stored === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    window.localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const [rates, setRates] = useState([]);
  const [allRates, setAllRates] = useState([]);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState(null);
  // For toggling banks in the graph
  const [visibleBanks, setVisibleBanks] = useState([]);

  // Color maps for banks
  const [bankColorsBuy, setBankColorsBuy] = useState({});
  const [bankColorsSell, setBankColorsSell] = useState({});

  // Generate random color for each bank
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Assign colors when banks change
  useEffect(() => {
    const banks = Array.from(new Set(allRates.map(r => r.bank)));
    setBankColorsBuy(prev => {
      const newColors = { ...prev };
      banks.forEach(bank => {
        if (!newColors[bank]) newColors[bank] = getRandomColor();
      });
      return newColors;
    });
    setBankColorsSell(prev => {
      const newColors = { ...prev };
      banks.forEach(bank => {
        if (!newColors[bank]) newColors[bank] = getRandomColor();
      });
      return newColors;
    });
  }, [allRates]);


  // Transform allRates for Recharts
  const graphData = React.useMemo(() => {
    if (!allRates || allRates.length === 0) return [];
    // Get all unique banks
    const banks = Array.from(new Set(allRates.map(r => r.bank)));
    // Set visibleBanks on first load
    if (visibleBanks.length === 0 && banks.length > 0) setVisibleBanks(banks);
    // Group by date
    const dateMap = {};
    allRates.forEach(r => {
      const date = new Date(r.sync_date).toLocaleDateString();
      if (!dateMap[date]) dateMap[date] = { date };
      dateMap[date][r.bank] = r.buy_rate;
    });
    // Convert to array and sort by date
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allRates, visibleBanks]);

  // Sell rate graph data
  const graphDataSell = React.useMemo(() => {
    if (!allRates || allRates.length === 0) return [];
    const banks = Array.from(new Set(allRates.map(r => r.bank)));
    const dateMap = {};
    allRates.forEach(r => {
      const date = new Date(r.sync_date).toLocaleDateString();
      if (!dateMap[date]) dateMap[date] = { date };
      dateMap[date][r.bank] = r.sell_rate;
    });
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allRates, visibleBanks]);

  // Calculate min/max for Y axis
  const yValues = graphData.flatMap(d =>
    visibleBanks.map(bank => d[bank]).filter(v => typeof v === 'number')
  );
  const yValuesSell = graphDataSell.flatMap(d =>
    visibleBanks.map(bank => d[bank]).filter(v => typeof v === 'number')
  );

  const minValue = yValues.length ? Math.floor(Math.min(...yValues)) : 0;
  const maxValue = yValues.length ? Math.ceil(Math.max(...yValues)) : 100;
  const minValueSell = yValuesSell.length ? Math.floor(Math.min(...yValuesSell)) : 0;
  const maxValueSell = yValuesSell.length ? Math.ceil(Math.max(...yValuesSell)) : 100;


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'bank', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    // Fetch all historical rates for the graph
    setGraphLoading(true);
    setGraphError(null);
    // Fetch all pages of historical rates
    const fetchAllRates = async () => {
      let all = [];
      let page = 1;
      const size = 100;
      let totalPages = 1;
      try {
        do {
          const res = await fetch(`http://localhost:8000/rates/all?page=${page}&size=${size}&sort_by=sync_date&order=asc`);
          if (!res.ok) throw new Error('Network response was not ok');
          const data = await res.json();
          all = all.concat(data.items);
          totalPages = data.pages || 1;
          page++;
        } while (page <= totalPages);
        setAllRates(all);
        setGraphLoading(false);
        setGraphError(null);
      } catch (err) {
        setGraphError(err.message);
        setGraphLoading(false);
      }
    };
    fetchAllRates();

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
      <div className="d-flex justify-content-end mb-3">
        <button
          className="btn btn-outline-primary"
          onClick={() => setDarkMode((d) => !d)}
        >
          {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>
      <h2 className="mb-4 text-center">DOP - USD Exchange Rates</h2>
      {/* Time Series Graph */}
      <div className="mb-4">
        <h4 className="mb-3 text-center">Historical USD Buy Rates</h4>
        {graphLoading ? (
          <div className="text-center py-3">Loading graph...</div>
        ) : graphError ? (
          <div className="alert alert-danger">{graphError}</div>
        ) : (
          <>
            {/* Bank toggles */}
            <div className="mb-2">
              {Array.from(new Set(allRates.map(r => r.bank))).map(bank => (
                <label key={bank} style={{ marginRight: 12 }}>
                  <input
                    type="checkbox"
                    checked={visibleBanks.includes(bank)}
                    onChange={e => {
                      setVisibleBanks(v =>
                        e.target.checked
                          ? [...v, bank]
                          : v.filter(b => b !== bank)
                      );
                    }}
                  />{' '}
                  {bank}
                </label>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={graphData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[minValue, maxValue]} />
                <Tooltip />
                <Legend />
                {visibleBanks.map(bank => (
                  <Line key={bank} type="monotone" dataKey={bank} stroke={bankColorsBuy[bank] || '#e74c3c'} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
      <div className="mb-4">
        <h4 className="mb-3 text-center">Historical USD Sell Rates</h4>
        {graphLoading ? (
          <div className="text-center py-3">Loading graph...</div>
        ) : graphError ? (
          <div className="alert alert-danger">{graphError}</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={graphDataSell} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[minValueSell, maxValueSell]} />
                <Tooltip />
                <Legend />
                {visibleBanks.map(bank => (
                  <Line key={bank} type="monotone" dataKey={bank} stroke={bankColorsSell[bank] || '#3498db'} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
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
