// frontend/src/api.js
const BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000';
const TOKEN = 'dev-token';

export async function health() {
  const r = await fetch(`${BASE}/api/health`);
  if (!r.ok) throw new Error('health failed');
  return r.json();
}

export async function predict(text, model) {
  const r = await fetch(`${BASE}/api/predict`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(model ? { 'X-Model': model } : {})
    },
    body: JSON.stringify({ text })
  });
  if (!r.ok) throw new Error('predict failed');
  return r.json(); // App.jsx already handles plain JSON
}

export async function uploadBatch(file, model) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch(`${BASE}/api/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      ...(model ? { 'X-Model': model } : {})
    },
    body: fd
  });
  if (!r.ok) throw new Error('batch failed');
  return r.json();
}
