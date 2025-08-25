import React, { useMemo, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import './ExchangeRateCharts.css';

const ExchangeRateCharts = React.memo(() => {
  const { darkMode } = useTheme();
  const { allRates, visibleBanks } = useData();
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly

  // Generate random color for each bank
  const getRandomColor = useCallback(() => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }, []);

  // Fixed stroke colors for specific banks
  const getStrokeColor = useCallback((bank, isSell = false) => {
    const name = (bank || '').toLowerCase();
    if (name.includes('bhd')) {return '#198754';} // Green
    if (name.includes('scotia')) {return '#dc3545';} // Red
    if (name.includes('banreservas') || name.includes('ban reservas')) {return '#0dcaf0';} // Cyan
    return isSell ? '#dc3545' : '#0d6efd'; // Red for sell, Blue for buy
  }, []);

  // Transform data based on view mode
  const transformData = useCallback((rates, isSell = false) => {
    if (!rates || rates.length === 0) {return [];}

    const banks = Array.from(new Set(rates.map((r) => r.bank)));
    if (visibleBanks.length === 0 && banks.length > 0) {
      // This will be handled by parent component
    }

    const dateMap = {};
    rates.forEach((r) => {
      let dateKey;
      const rateDate = new Date(r.sync_date);

      switch (viewMode) {
        case 'weekly': {
          // Group by week (Monday start)
          const weekStart = new Date(rateDate);
          weekStart.setDate(rateDate.getDate() - rateDate.getDay() + 1);
          dateKey = weekStart.toLocaleDateString();
          break;
        }
        case 'monthly':
          // Group by month
          dateKey = `${rateDate.getFullYear()}-${String(rateDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // daily
          dateKey = rateDate.toLocaleDateString();
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { date: dateKey };
      }
      dateMap[dateKey][r.bank] = isSell ? r.sell_rate : r.buy_rate;
    });

    return Object.values(dateMap).sort((a, b) => {
      if (viewMode === 'monthly') {
        return a.date.localeCompare(b.date);
      }
      return new Date(a.date) - new Date(b.date);
    });
  }, [viewMode, visibleBanks.length]);

  const graphData = useMemo(() => transformData(allRates, false), [allRates, transformData]);
  const graphDataSell = useMemo(() => transformData(allRates, true), [allRates, transformData]);

  // Calculate min/max for Y axis
  const yValues = graphData.flatMap((d) =>
    visibleBanks.map((bank) => d[bank]).filter((v) => typeof v === 'number')
  );
  const yValuesSell = graphDataSell.flatMap((d) =>
    visibleBanks.map((bank) => d[bank]).filter((v) => typeof v === 'number')
  );

  const minValue = yValues.length ? Math.floor(Math.min(...yValues)) : 0;
  const maxValue = yValues.length ? Math.ceil(Math.max(...yValues)) : 100;
  const minValueSell = yValuesSell.length ? Math.floor(Math.min(...yValuesSell)) : 0;
  const maxValueSell = yValuesSell.length ? Math.ceil(Math.max(...yValuesSell)) : 100;

  const formatXAxis = useCallback((tickItem) => {
    if (viewMode === 'monthly') {
      const [year, month] = tickItem.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
    }
    return tickItem;
  }, [viewMode]);

  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`custom-tooltip ${darkMode ? 'dark' : 'light'}`}>
          <p className="tooltip-label">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: $${entry.value?.toFixed(2) || 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, [darkMode]);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  if (!allRates || allRates.length === 0) {
    return (
      <div className="charts-container">
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="charts-container">
      {/* View Mode Controls */}
      <div className="chart-controls mb-3">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'daily' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleViewModeChange('daily')}
          >
            Daily
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'weekly' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleViewModeChange('weekly')}
          >
            Weekly
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleViewModeChange('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Buy Rates Chart */}
      <div className="chart-section mb-4">
        <h5 className="chart-title">USD Buy Rates</h5>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#495057' : '#dee2e6'} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke={darkMode ? '#adb5bd' : '#6c757d'}
            />
            <YAxis
              domain={[minValue, maxValue]}
              stroke={darkMode ? '#adb5bd' : '#6c757d'}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {visibleBanks.map((bank) => (
              <Line
                key={`buy-${bank}`}
                type="monotone"
                dataKey={bank}
                stroke={getStrokeColor(bank, false)}
                strokeWidth={2}
                dot={{ fill: getStrokeColor(bank, false), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getStrokeColor(bank, false), strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sell Rates Chart */}
      <div className="chart-section">
        <h5 className="chart-title">USD Sell Rates</h5>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphDataSell} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#495057' : '#dee2e6'} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke={darkMode ? '#adb5bd' : '#6c757d'}
            />
            <YAxis
              domain={[minValueSell, maxValueSell]}
              stroke={darkMode ? '#adb5bd' : '#6c757d'}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {visibleBanks.map((bank) => (
              <Line
                key={`sell-${bank}`}
                type="monotone"
                dataKey={bank}
                stroke={getStrokeColor(bank, true)}
                strokeWidth={2}
                dot={{ fill: getStrokeColor(bank, true), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getStrokeColor(bank, true), strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

ExchangeRateCharts.displayName = 'ExchangeRateCharts';

export default ExchangeRateCharts;
