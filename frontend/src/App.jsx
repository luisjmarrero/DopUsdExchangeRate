import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import './App.css';

function App() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/rates/all')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setRates(data.map((row, idx) => ({ ...row, id: idx })));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const columns = [
    { field: 'bank', headerName: 'Bank', flex: 1, sortable: true },
    { field: 'buy_rate', headerName: 'Buy Rate', flex: 1, type: 'number', sortable: true, renderCell: (params) => typeof params.value === 'number' ? params.value.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }) : '' },
    { field: 'sell_rate', headerName: 'Sell Rate', flex: 1, type: 'number', sortable: true, renderCell: (params) => typeof params.value === 'number' ? params.value.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }) : '' },
    { field: 'sync_date', headerName: 'Sync Date', flex: 2, sortable: true },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        padding: 2,
      }}
    >
      <Typography variant="h4" gutterBottom>
        DOP/USD Exchange Rates
      </Typography>
      <Paper elevation={3} sx={{ p: 2, maxWidth: 900, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <DataGrid
            rows={rates}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 25]}
            autoHeight
            sx={{
              margin: '0 auto',
              backgroundColor: 'background.paper',
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: '#1976d2',
                color: '#fff',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-row': {
                backgroundColor: '#f5f5f5',
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
}

export default App;
