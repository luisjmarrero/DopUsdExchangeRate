import React from 'react';
import { useData } from '../../contexts/DataContext';
import './MonthlyInsights.css';

const MonthlyInsights = React.memo(() => {
  const { allRates } = useData();
  const rates = allRates;
  const getCurrentMonthData = () => {
    if (!rates || rates.length === 0) {
      return null;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthRates = rates.filter(rate => {
      const rateDate = new Date(rate.sync_date);
      return (
        rateDate.getMonth() === currentMonth &&
        rateDate.getFullYear() === currentYear
      );
    });

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

  const monthData = getCurrentMonthData();
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  if (!monthData) {
    return (
      <div className='monthly-insights-container'>
        <h4 className='mb-3'>Monthly Insights</h4>
        <div className='text-center py-4'>
          <p className='text-muted'>No data available for {monthName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='monthly-insights-container'>
      <h4 className='mb-3'>{monthName} Insights</h4>

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
