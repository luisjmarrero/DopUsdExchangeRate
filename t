[1mdiff --git a/frontend/src/App.js b/frontend/src/App.js[m
[1mindex 9ce23dc..796870e 100644[m
[1m--- a/frontend/src/App.js[m
[1m+++ b/frontend/src/App.js[m
[36m@@ -2,9 +2,34 @@[m [mimport logo from './logo.svg';[m
 import './App.css';[m
 [m
 import React, { useEffect, useState } from 'react';[m
[32m+[m[32mimport { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';[m
 [m
 function App() {[m
   const [rates, setRates] = useState([]);[m
[32m+[m[32m  const [allRates, setAllRates] = useState([]);[m
[32m+[m[32m  const [graphLoading, setGraphLoading] = useState(true);[m
[32m+[m[32m  const [graphError, setGraphError] = useState(null);[m
[32m+[m[32m  // For toggling banks in the graph[m
[32m+[m[32m  const [visibleBanks, setVisibleBanks] = useState([]);[m
[32m+[m
[32m+[m[32m  // Transform allRates for Recharts[m
[32m+[m[32m  const graphData = React.useMemo(() => {[m
[32m+[m[32m    if (!allRates || allRates.length === 0) return [];[m
[32m+[m[32m    // Get all unique banks[m
[32m+[m[32m    const banks = Array.from(new Set(allRates.map(r => r.bank)));[m
[32m+[m[32m    // Set visibleBanks on first load[m
[32m+[m[32m    if (visibleBanks.length === 0 && banks.length > 0) setVisibleBanks(banks);[m
[32m+[m[32m    // Group by date[m
[32m+[m[32m    const dateMap = {};[m
[32m+[m[32m    allRates.forEach(r => {[m
[32m+[m[32m      const date = new Date(r.sync_date).toLocaleDateString();[m
[32m+[m[32m      if (!dateMap[date]) dateMap[date] = { date };[m
[32m+[m[32m      dateMap[date][r.bank] = r.buy_rate;[m
[32m+[m[32m    });[m
[32m+[m[32m    // Convert to array and sort by date[m
[32m+[m[32m    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));[m
[32m+[m[32m  }, [allRates, visibleBanks]);[m
[32m+[m
   const [loading, setLoading] = useState(true);[m
   const [error, setError] = useState(null);[m
   const [sortConfig, setSortConfig] = useState({ key: 'bank', direction: 'asc' });[m
[36m@@ -12,6 +37,34 @@[m [mfunction App() {[m
   const rowsPerPage = 10;[m
 [m
   useEffect(() => {[m
[32m+[m[32m    // Fetch all historical rates for the graph[m
[32m+[m[32m    setGraphLoading(true);[m
[32m+[m[32m    setGraphError(null);[m
[32m+[m[32m    // Fetch all pages of historical rates[m
[32m+[m[32m    const fetchAllRates = async () => {[m
[32m+[m[32m      let all = [];[m
[32m+[m[32m      let page = 1;[m
[32m+[m[32m      const size = 100;[m
[32m+[m[32m      let totalPages = 1;[m
[32m+[m[32m      try {[m
[32m+[m[32m        do {[m
[32m+[m[32m          const res = await fetch(`http://localhost:8000/rates/all?page=${page}&size=${size}&sort_by=sync_date&order=asc`);[m
[32m+[m[32m          if (!res.ok) throw new Error('Network response was not ok');[m
[32m+[m[32m          const data = await res.json();[m
[32m+[m[32m          all = all.concat(data.items);[m
[32m+[m[32m          totalPages = data.pages || 1;[m
[32m+[m[32m          page++;[m
[32m+[m[32m        } while (page <= totalPages);[m
[32m+[m[32m        setAllRates(all);[m
[32m+[m[32m        setGraphLoading(false);[m
[32m+[m[32m        setGraphError(null);[m
[32m+[m[32m      } catch (err) {[m
[32m+[m[32m        setGraphError(err.message);[m
[32m+[m[32m        setGraphLoading(false);[m
[32m+[m[32m      }[m
[32m+[m[32m    };[m
[32m+[m[32m    fetchAllRates();[m
[32m+[m
     setLoading(true);[m
     setError(null);[m
     const params = new URLSearchParams({[m
[36m@@ -53,6 +106,48 @@[m [mfunction App() {[m
   return ([m
     <div className="container py-5">[m
       <h2 className="mb-4 text-center">DOP/USD Exchange Rates</h2>[m
[32m+[m[32m      {/* Time Series Graph */}[m
[32m+[m[32m      <div className="mb-4">[m
[32m+[m[32m        {graphLoading ? ([m
[32m+[m[32m          <div className="text-center py-3">Loading graph...</div>[m
[32m+[m[32m        ) : graphError ? ([m
[32m+[m[32m          <div className="alert alert-danger">{graphError}</div>[m
[32m+[m[32m        ) : ([m
[32m+[m[32m          <>[m
[32m+[m[32m            {/* Bank toggles */}[m
[32m+[m[32m            <div className="mb-2">[m
[32m+[m[32m              {Array.from(new Set(allRates.map(r => r.bank))).map(bank => ([m
[32m+[m[32m                <label key={bank} style={{ marginRight: 12 }}>[m
[32m+[m[32m                  <input[m
[32m+[m[32m                    type="checkbox"[m
[32m+[m[32m                    checked={visibleBanks.includes(bank)}[m
[32m+[m[32m                    onChange={e => {[m
[32m+[m[32m                      setVisibleBanks(v =>[m
[32m+[m[32m                        e.target.checked[m
[32m+[m[32m                          ? [...v, bank][m
[32m+[m[32m                          : v.filter(b => b !== bank)[m
[32m+[m[32m                      );[m
[32m+[m[32m                    }}[m
[32m+[m[32m                  />{' '}[m
[32m+[m[32m                  {bank}[m
[32m+[m[32m                </label>[m
[32m+[m[32m              ))}[m
[32m+[m[32m            </div>[m
[32m+[m[32m            <ResponsiveContainer width="100%" height={350}>[m
[32m+[m[32m              <LineChart data={graphData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>[m
[32m+[m[32m                <CartesianGrid strokeDasharray="3 3" />[m
[32m+[m[32m                <XAxis dataKey="date" />[m
[32m+[m[32m                <YAxis />[m
[32m+[m[32m                <Tooltip />[m
[32m+[m[32m                <Legend />[m
[32m+[m[32m                {visibleBanks.map(bank => ([m
[32m+[m[32m                  <Line key={bank} type="monotone" dataKey={bank} strokeWidth={2} dot={false} />[m
[32m+[m[32m                ))}[m
[32m+[m[32m              </LineChart>[m
[32m+[m[32m            </ResponsiveContainer>[m
[32m+[m[32m          </>[m
[32m+[m[32m        )}[m
[32m+[m[32m      </div>[m
       <div className="row justify-content-center">[m
         <div className="col-lg-10">[m
           {loading ? ([m
