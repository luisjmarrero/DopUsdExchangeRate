import React from 'react';
import './MainLayout.css';

const MainLayout = React.memo(({ children, leftColumn, rightColumn }) => {
  return (
    <div className='main-layout'>
      <div className='container'>
        <div className='row'>
          {/* Left Column */}
          <div className='col-lg-6 col-md-12 mb-4'>
            <div className='left-column'>{leftColumn}</div>
          </div>

          {/* Right Column */}
          <div className='col-lg-6 col-md-12 mb-4'>
            <div className='right-column'>{rightColumn}</div>
          </div>
        </div>

        {/* Full Width Section */}
        {children && (
          <div className='row'>
            <div className='col-12'>
              <div className='full-width-section'>{children}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MainLayout.displayName = 'MainLayout';

export default MainLayout;
