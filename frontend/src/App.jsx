// frontend/src/App.jsx
import { useEffect, useState } from 'react'
import { health, predict } from './api'
import BatchUpload from './components/BatchUpload'
import './App.css'

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function App() {
  const [ok, setOk] = useState('checking…')
  const [text, setText] = useState('I love this product!')
  const [out, setOut] = useState(null)

  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])

  // NEW: model picker
  const [model, setModel] = useState('hf') // 'hf' | 'sk' | 'heuristic'

  // health check once
  useEffect(() => {
    health()
      .then(() => setOk('backend ok'))
      .catch(() => setOk('backend unreachable'))
  }, [])

  // analyze only when at least MIN_CHARS
  const MIN_CHARS = 3
  useEffect(() => {
    const id = setTimeout(() => {
      const t = text.trim()
      if (t.length < MIN_CHARS) {
        setOut(null)
        return
      }
      // pass selected model down to API; support either shape: r or {data:r}
      predict(t, model)
        .then((r) => setOut(r?.data ?? r))
        .catch(() => setOut({ error: true }))
    }, 300)
    return () => clearTimeout(id)
  }, [text, model])

  // idle timer for donut
  const [idle, setIdle] = useState(true)
  const IDLE_DELAY = 400
  useEffect(() => {
    setIdle(false)
    const t = setTimeout(() => setIdle(true), IDLE_DELAY)
    return () => clearTimeout(t)
  }, [text])

  // donut data
  const donutData = out && !out?.error ? (() => {
    const p = out.label === 'positive' ? (out.score ?? 1) : 0
    const n = out.label === 'neutral'  ? (out.score ?? 1) : 0
    const ng = out.label === 'negative' ? (out.score ?? 1) : 0
    const epsilon = 0.0001
    return {
      labels: ['positive', 'neutral', 'negative'],
      datasets: [{
        data: [p || epsilon, n || epsilon, ng || epsilon],
        backgroundColor: ['#22c55e', '#facc15', '#ef4444'],
        borderWidth: 0
      }]
    }
  })() : null

  // bar data
  const barData = summary ? {
    labels: ['positive','neutral','negative'],
    datasets: [{
      label: 'Counts',
      data: [
        summary.counts?.positive || 0,
        summary.counts?.neutral || 0,
        summary.counts?.negative || 0
      ],
      backgroundColor: ['#22c55e', '#facc15', '#ef4444'],
      borderWidth: 0
    }]
  } : null

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f9fafb',
        fontFamily: 'system-ui'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'white',
          padding: 32,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <h2>AI Sentiment — {ok}</h2>

        {/* Model switch */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0 12px' }}>
          <label style={{ fontSize: 14, color: '#555' }}>Model:</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 8 }}
          >
            <option value="hf">Hugging Face</option>
            <option value="sk">Scikit‑learn</option>
            <option value="heuristic">Heuristic</option>
          </select>
        </div>

        {/* Single review */}
        <textarea
          rows={5}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {(text.trim().length > 0 && text.trim().length < MIN_CHARS) && (
          <div style={{ marginTop: 8, color: '#777', fontSize: 13 }}>
            Type at least {MIN_CHARS} characters to analyze…
          </div>
        )}

        {out?.error && <div style={{ color: 'tomato', marginTop: 8 }}>Auth or server error</div>}

        {out && !out.error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 240px',
              gap: 16,
              alignItems: 'start',
              marginTop: 12
            }}
          >
            <div style={{ fontSize: 16 }}>
              <span className={`result-label ${out.label}`}>{out.label}</span>
              <span style={{ marginLeft: 8, color: '#555' }}>
                score {out.score?.toFixed?.(3)} via {out.model}
              </span>
            </div>

            {idle && donutData && (
              <div style={{ maxWidth: 240 }}>
                <Doughnut
                  data={donutData}
                  options={{
                    cutout: '60%',
                    plugins: { legend: { labels: { color: '#333' } } },
                    maintainAspectRatio: false
                  }}
                  height={200}
                />
              </div>
            )}
          </div>
        )}

        <section style={{ marginTop: 32 }}>
          <h3>Batch CSV Analysis</h3>
          {/* pass model to batch component */}
          <BatchUpload
            onResults={(s, r) => { setSummary(s); setRows(r) }}
            model={model}
          />

          {barData && (
            <div style={{ maxWidth: 520, marginTop: 12 }}>
              <Bar
                data={barData}
                options={{
                  scales: {
                    x: { ticks: { color: '#333' }, grid: { display: false } },
                    y: { ticks: { color: '#333' }, beginAtZero: true }
                  },
                  plugins: { legend: { labels: { color: '#333' } } }
                }}
              />
            </div>
          )}

          {summary && (
            <div style={{ marginTop: 12, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
              <div><b>Total:</b> {summary.total}</div>
              <div style={{ marginTop: 6 }}>
                <b>Counts:</b>&nbsp;
                positive {summary.counts?.positive || 0} •
                neutral {summary.counts?.neutral || 0} •
                negative {summary.counts?.negative || 0}
              </div>
              <div style={{ marginTop: 6 }}>
                <b>Top keywords:</b> {summary.keywords?.join(', ') || '—'}
              </div>
            </div>
          )}

          {rows?.length > 0 && (
            <div style={{ marginTop: 12, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {Object.keys(rows[0]).map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          borderBottom: '1px solid #eee',
                          padding: '6px 4px',
                          background: '#fafafa'
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {Object.keys(rows[0]).map((h) => (
                        <td
                          key={h}
                          style={{
                            borderBottom: '1px solid #f2f2f2',
                            padding: '6px 4px',
                            fontSize: 14
                          }}
                        >
                          {String(r[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
