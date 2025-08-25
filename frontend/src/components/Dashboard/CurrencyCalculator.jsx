import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import './CurrencyCalculator.css';

const CurrencyCalculator = React.memo(() => {
  const { rates } = useData();
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('DOP');
  const [toCurrency, setToCurrency] = useState('USD');
  const [rateType, setRateType] = useState('buy');
  const [selectedBank, setSelectedBank] = useState('');

  // Get available banks
  const availableBanks = useMemo(() => {
    if (!rates || rates.length === 0) {
      return [];
    }
    return rates.map(rate => rate.bank);
  }, [rates]);

  // Set default selected bank when rates load
  useEffect(() => {
    if (availableBanks.length > 0 && !selectedBank) {
      setSelectedBank(availableBanks[0]);
    }
  }, [availableBanks, selectedBank]);

  // Get the selected bank's rate for calculation
  const currentRate = useMemo(() => {
    if (!rates || rates.length === 0 || !selectedBank) {
      return null;
    }

    // Find the selected bank's rate
    const selectedBankRate = rates.find(rate => rate.bank === selectedBank);
    if (!selectedBankRate) {
      return null;
    }

    // Use the selected rate type
    const rateToUse = rateType === 'buy' ? 'buy_rate' : 'sell_rate';

    return selectedBankRate[rateToUse] || null;
  }, [rates, selectedBank, rateType]);

  // Calculate converted amount
  const convertedAmount = useMemo(() => {
    if (!amount || !currentRate || isNaN(amount)) {
      return null;
    }

    const numAmount = parseFloat(amount);
    if (fromCurrency === 'DOP') {
      // From DOP: divide by the selected rate
      return numAmount / currentRate;
    } else {
      // From USD: multiply by the selected rate
      return numAmount * currentRate;
    }
  }, [amount, currentRate, fromCurrency]);

  const formatNumberWithCommas = (value) => {
    if (!value) {
      return '';
    }
    // Remove existing commas and format
    const numValue = value.replace(/,/g, '');
    if (isNaN(numValue)) {
      return value;
    }

    const parts = numValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Remove commas for validation and storage
    const rawValue = value.replace(/,/g, '');

    // Allow only numbers and decimal point
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      setAmount(rawValue);
    }
  };

  const handleFromCurrencyChange = (newFromCurrency) => {
    if (newFromCurrency === toCurrency) {
      // Swap currencies
      setToCurrency(fromCurrency);
    }
    setFromCurrency(newFromCurrency);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatCurrency = (value, currency) => {
    if (value === null) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (!rates || rates.length === 0) {
    return (
      <div className='currency-calculator-container'>
        <h4 className='mb-3'>Currency Calculator</h4>
        <div className='text-center py-4'>
          <p className='text-muted'>No exchange rates available</p>
        </div>
      </div>
    );
  }

  return (
    <div className='currency-calculator-container'>
      <h4 className='mb-3'>Currency Calculator</h4>

      <div className='calculator-form'>
        {/* Amount Input */}
        <div className='form-group mb-3'>
          <label className='form-label' htmlFor='amount-input'>Amount</label>
           <input
             id='amount-input'
             type='text'
             className='form-control'
             value={formatNumberWithCommas(amount)}
             onChange={handleAmountChange}
             placeholder={`Enter amount in ${fromCurrency}`}
           />
        </div>

        {/* Currency Selection */}
        <div className='row mb-3'>
          <div className='col-5'>
            <label className='form-label' htmlFor='from-currency-select'>From</label>
            <select
              id='from-currency-select'
              className='form-select'
              value={fromCurrency}
              onChange={(e) => handleFromCurrencyChange(e.target.value)}
            >
              <option value='DOP'>DOP</option>
              <option value='USD'>USD</option>
            </select>
          </div>

          <div className='col-2 d-flex align-items-end justify-content-center'>
            <button
              className='btn btn-outline-secondary btn-sm swap-btn'
              onClick={swapCurrencies}
              title='Swap currencies'
            >
              ⇄
            </button>
          </div>

          <div className='col-5'>
            <label className='form-label' htmlFor='to-currency-select'>To</label>
            <select
              id='to-currency-select'
              className='form-select'
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              <option value='DOP'>DOP</option>
              <option value='USD'>USD</option>
            </select>
          </div>
        </div>

        {/* Rate Type Selection */}
        <div className='form-group mb-3'>
          <label className='form-label' htmlFor='rate-type-buttons'>Rate Type</label>
          <div id='rate-type-buttons' className='rate-type-buttons'>
            <button
              className={`btn btn-sm me-2 ${rateType === 'buy' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setRateType('buy')}
            >
              Buy Rate
            </button>
            <button
              className={`btn btn-sm ${rateType === 'sell' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setRateType('sell')}
            >
              Sell Rate
            </button>
          </div>
        </div>

        {/* Bank Selection */}
        {availableBanks.length > 1 && (
          <div className='form-group mb-3'>
            <label className='form-label' htmlFor='bank-select'>Bank</label>
            <select
              id='bank-select'
              className='form-select'
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              {availableBanks.map(bank => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Result */}
        <div className='result-section'>
          {selectedBank && (
            <div className='result-item'>
              <span className='result-label'>Bank:</span>
              <span className='result-value'>{selectedBank}</span>
            </div>
          )}
          <div className='result-item'>
            <span className='result-label'>Exchange Rate:</span>
            <span className='result-value'>
              {currentRate ? `$${currentRate.toFixed(2)}` : 'N/A'}
            </span>
          </div>

          <div className='result-item'>
            <span className='result-label'>Converted Amount:</span>
            <span className='result-value converted-amount'>
              {convertedAmount !== null
                ? formatCurrency(convertedAmount, toCurrency)
                : formatCurrency(0, toCurrency)
              }
            </span>
          </div>
        </div>

        {/* Rate Information */}
        <div className='rate-info mt-3'>
          <small className='text-muted'>
            {rateType === 'buy'
              ? `Using buy rate ${fromCurrency === 'DOP' ? '(DOP to USD conversion)' : '(USD to DOP conversion)'}`
              : `Using sell rate ${fromCurrency === 'DOP' ? '(DOP to USD conversion)' : '(USD to DOP conversion)'}`
            }
          </small>
        </div>
      </div>
    </div>
  );
});

CurrencyCalculator.displayName = 'CurrencyCalculator';

export default CurrencyCalculator;