// frontend/src/components/BatchUpload.jsx
import React, { useState } from 'react'
import { uploadBatch } from '../api'

export default function BatchUpload({ onResults, model }) {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handle = async () => {
    if (!file) return
    setBusy(true); setErr('')
    try {
      const data = await uploadBatch(file, model) // <- pass model
      onResults?.(data.summary, data.results)
    } catch (e) {
      setErr(e.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handle} disabled={!file || busy} style={{ marginLeft: 8 }}>
        {busy ? 'Processing…' : 'Upload & Analyze'}
      </button>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <p style={{ color: '#555' }}>
        CSV must include a <code>text</code> column.
      </p>
    </div>
  )
}
