import React, { useRef, useEffect, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { getWeeklyData, getExProgress } from '../utils/helpers';
import { EXERCISES } from '../config/data';

const CHART_DEFAULTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555', font: { family: 'JetBrains Mono', size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555', font: { family: 'JetBrains Mono', size: 10 } }, beginAtZero: true }
  }
};

export function WeeklyVolumeChart({ sessions }) {
  const canvasRef = useRef(null); 
  const chartRef = useRef(null);

  useEffect(() => {
    if(!canvasRef.current) return;
    const data = getWeeklyData(sessions);
    if(chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(w => w.label),
        datasets: [{
          label: 'Wolumen', 
          data: data.map(w => w.volume),
          backgroundColor: data.map(w => w.count > 0 ? 'rgba(204,255,0,0.75)' : 'rgba(204,255,0,0.12)'),
          borderRadius: 5, borderSkipped: false,
        }]
      },
      options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, tooltip: { callbacks: { label: ctx => `${ctx.parsed.y.toLocaleString()} vol` } } } }
    });
    return () => { if(chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [sessions]);

  return <div className="chart-wrap"><canvas ref={canvasRef}></canvas></div>;
}

export function ExProgressChart({ sessions }) {
  const canvasRef = useRef(null); 
  const chartRef = useRef(null);
  const [selId, setSelId] = useState('');

  const exInSess = useMemo(() => {
    const ids = new Set(); 
    sessions.forEach(s => s.exercises.forEach(e => ids.add(e.id)));
    return [...ids].map(id => ({id, name: EXERCISES.find(e => e.id === id)?.name || id}));
  }, [sessions]);

  useEffect(() => {
    if(!selId || !canvasRef.current) return;
    const pd = getExProgress(sessions, selId);
    if(chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    if(!pd.length) return;
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: pd.map(d => d.date),
        datasets: [
          { label: 'Max ciężar (kg)', data: pd.map(d => d.maxWeight || null), borderColor: '#ccff00', backgroundColor: 'rgba(204,255,0,0.08)', pointBackgroundColor: '#ccff00', pointRadius: 5, borderWidth: 2, tension: .3, fill: true },
          { label: 'Łączne powt.', data: pd.map(d => d.totalReps), borderColor: '#50b4ff', backgroundColor: 'rgba(80,180,255,0.06)', pointBackgroundColor: '#50b4ff', pointRadius: 5, borderWidth: 2, tension: .3, fill: true, yAxisID: 'y2' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#555', font: { family: 'JetBrains Mono', size: 10 }, boxWidth: 10 } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555', font: { family: 'JetBrains Mono', size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555', font: { family: 'JetBrains Mono', size: 10 } }, beginAtZero: true },
          y2: { display: false, beginAtZero: true }
        }
      }
    });
    return () => { if(chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [selId, sessions]);

  if(!exInSess.length) return <div style={{textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: '.82rem'}}>Zaloguj trening, aby śledzić postępy</div>;

  return (
    <div>
      <select className="ex-select" value={selId} onChange={e => setSelId(e.target.value)}>
        <option value="">— wybierz ćwiczenie —</option>
        {exInSess.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      {selId && <div className="chart-wrap"><canvas ref={canvasRef}></canvas></div>}
    </div>
  );
}