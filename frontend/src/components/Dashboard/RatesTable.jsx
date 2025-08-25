import React from 'react';
import { useData } from '../../contexts/DataContext';
import './RatesTable.css';

const RatesTable = React.memo(() => {
  const { rates, loading, error } = useData();
  const getBankLogo = bankName => {
    const name = bankName.toLowerCase();
    if (name.includes('bhd')) {
      return '🏦';
    }
    if (name.includes('scotia')) {
      return '🏛️';
    }
    if (name.includes('banreservas') || name.includes('ban reservas')) {
      return '🏢';
    }
    return '🏦';
  };

  const formatChange = change => {
    if (!change && change !== 0) {
      return (
        <span className="change-indicator change-neutral">
          N/A
        </span>
      );
    }

    if (change === 0) {
      return (
        <span className="change-indicator change-neutral">
          0.00
        </span>
      );
    }

    const isPositive = change > 0;
    const sign = isPositive ? '+' : '';
    const className = isPositive ? 'change-positive' : 'change-negative';

    return (
      <span className={`change-indicator ${className}`}>
        {sign}
        {change.toFixed(2)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className='rates-table-container'>
        <h4 className='mb-3'>Current Exchange Rates</h4>
        <div className='text-center py-4'>
          <div className='spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
          <p className='mt-2 text-muted'>Loading exchange rates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rates-table-container'>
        <h4 className='mb-3'>Current Exchange Rates</h4>
        <div className='alert alert-danger'>
          <strong>Error loading rates:</strong> {error}
        </div>
      </div>
    );
  }

  if (!rates || rates.length === 0) {
    return (
      <div className='rates-table-container'>
        <h4 className='mb-3'>Current Exchange Rates</h4>
        <div className='text-center py-4'>
          <p className='text-muted'>No exchange rates available</p>
        </div>
      </div>
    );
  }

  return (
    <div className='rates-table-container'>
      <h4 className='mb-3'>Current Exchange Rates</h4>
      <div className='table-responsive'>
         <table className='table table-hover'>
           <thead>
            <tr>
              <th>Bank</th>
              <th className='text-end'>Buy Rate</th>
              <th className='text-end'>Change</th>
              <th className='text-end'>Sell Rate</th>
              <th className='text-end'>Change</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(rate => (
              <tr key={rate.id || rate.bank}>
                <td>
                  <div className='bank-info'>
                    <span className='bank-logo me-2'>
                      {getBankLogo(rate.bank)}
                    </span>
                    <span className='bank-name'>{rate.bank}</span>
                  </div>
                </td>
                <td className='text-end'>
                  <span className='rate-value buy-rate'>
                    ${rate.buy_rate?.toFixed(2) || 'N/A'}
                  </span>
                </td>
                <td className='text-end'>{formatChange(rate.buy_change)}</td>
                <td className='text-end'>
                  <span className='rate-value sell-rate'>
                    ${rate.sell_rate?.toFixed(2) || 'N/A'}
                  </span>
                </td>
                <td className='text-end'>{formatChange(rate.sell_change)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

RatesTable.displayName = 'RatesTable';

export default RatesTable;
