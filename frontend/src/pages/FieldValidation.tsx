import React, { useState, useEffect } from 'react';
import { getValidations, submitValidation } from '../services/api';
import type { ValidationRecord } from '../services/api';

const TARGETS = ['M-001','M-002','M-003','M-004','M-005','M-006','M-007','M-008','M-009','M-010'];

export default function FieldValidation() {
  const [records, setRecords] = useState<ValidationRecord[]>([]);
  const [form, setForm] = useState({
    target_id: 'M-001',
    latitude: '',
    longitude: '',
    sample_id: '',
    mn_grade: '',
    depth: '',
    lithology: '',
    result: 'confirmed',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [tab, setTab] = useState<'form' | 'history'>('form');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    getValidations().then(d => setRecords(d.validations)).catch(() => {});
  };

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude || !form.sample_id) {
      showToast('Please provide GPS coordinates and sample ID.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await submitValidation({
        target_id: form.target_id,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        sample_id: form.sample_id,
        mn_grade: form.mn_grade ? parseFloat(form.mn_grade) : undefined,
        depth: form.depth ? parseFloat(form.depth) : undefined,
        lithology: form.lithology || undefined,
        result: form.result,
        notes: form.notes || undefined,
      });

      showToast('Validation recorded successfully. Training data updated.', 'success');
      setForm(f => ({ ...f, sample_id: '', mn_grade: '', depth: '', lithology: '', notes: '' }));
      loadRecords();
      setTab('history');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Submission failed. Check backend connection.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resultLabel = { confirmed: 'Mn Confirmed', not_found: 'Mn Not Found', inconclusive: 'Inconclusive' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', background: 'var(--bg-white)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h1 className="page-title">Field Validation</h1>
            <p className="page-subtitle">Submit field observations to update the model training dataset</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="status-pill">
              <span className="status-dot green" />
              <span className="status-text">{records.length} Records</span>
            </div>
          </div>
        </div>
        <div className="tabs">
          <div className={`tab ${tab === 'form' ? 'active' : ''}`} onClick={() => setTab('form')}>Submit Validation</div>
          <div className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            Validation History ({records.length})
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'form' ? (
          <div style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Target ID */}
                <div className="form-group">
                  <label className="form-label">Target ID</label>
                  <select className="form-select" value={form.target_id}
                    onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))}>
                    {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Sample ID */}
                <div className="form-group">
                  <label className="form-label">Sample ID *</label>
                  <input className="form-input" placeholder="e.g. MN-001-01" value={form.sample_id}
                    onChange={e => setForm(f => ({ ...f, sample_id: e.target.value }))} required />
                </div>

                {/* GPS */}
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input className="form-input" type="number" step="0.0001" placeholder="e.g. 22.1820"
                    value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input className="form-input" type="number" step="0.0001" placeholder="e.g. 80.3200"
                    value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} required />
                </div>

                {/* Mn Grade */}
                <div className="form-group">
                  <label className="form-label">Mn Grade (%)</label>
                  <input className="form-input" type="number" step="0.1" placeholder="e.g. 38.4"
                    value={form.mn_grade} onChange={e => setForm(f => ({ ...f, mn_grade: e.target.value }))} />
                </div>

                {/* Depth */}
                <div className="form-group">
                  <label className="form-label">Depth (m)</label>
                  <input className="form-input" type="number" step="0.5" placeholder="e.g. 42"
                    value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value }))} />
                </div>

                {/* Lithology */}
                <div className="form-group">
                  <label className="form-label">Lithology</label>
                  <input className="form-input" placeholder="e.g. Mn-bearing phyllite"
                    value={form.lithology} onChange={e => setForm(f => ({ ...f, lithology: e.target.value }))} />
                </div>

                {/* Result */}
                <div className="form-group">
                  <label className="form-label">Validation Result *</label>
                  <select className="form-select" value={form.result}
                    onChange={e => setForm(f => ({ ...f, result: e.target.value }))}>
                    <option value="confirmed">✓ Mn Confirmed</option>
                    <option value="not_found">✕ Mn Not Found</option>
                    <option value="inconclusive">△ Inconclusive</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Field Notes</label>
                  <textarea className="form-textarea" placeholder="Observations, context, sample description…"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                {/* Photo upload */}
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Field Photo</label>
                  <div className="upload-area" onClick={() => document.getElementById('photo-input')?.click()}>
                    {photoFile ? (
                      <span>📷 {photoFile.name}</span>
                    ) : (
                      <>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                        <div>Click to upload field photograph</div>
                        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>JPG, PNG — Max 10 MB</div>
                      </>
                    )}
                  </div>
                  <input id="photo-input" type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              {/* Field Evidence Summary */}
              {(form.sample_id || form.mn_grade) && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--green-bg)', border: '1px solid var(--green-muted)', borderRadius: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--green)', marginBottom: 6 }}>Field Evidence Summary</div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {form.sample_id && <div style={{ fontSize: 12 }}>✓ Sample: <strong>{form.sample_id}</strong></div>}
                    {form.mn_grade && <div style={{ fontSize: 12 }}>✓ Mn Grade: <strong>{form.mn_grade}%</strong></div>}
                    {form.depth && <div style={{ fontSize: 12 }}>✓ Depth: <strong>{form.depth} m</strong></div>}
                    {photoFile && <div style={{ fontSize: 12 }}>✓ Photo uploaded</div>}
                    {(form.latitude && form.longitude) && <div style={{ fontSize: 12 }}>✓ GPS recorded</div>}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>
                  {submitting ? <><span className="spinner" /> Submitting…</> : '↑ SUBMIT VALIDATION'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setForm({
                  target_id: 'M-001', latitude: '', longitude: '', sample_id: '', mn_grade: '',
                  depth: '', lithology: '', result: 'confirmed', notes: ''
                })}>
                  Reset
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ padding: '12px 20px' }}>
            {records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div>No validation records yet. Submit your first field observation.</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Sample</th>
                    <th>GPS</th>
                    <th>Mn Grade</th>
                    <th>Depth</th>
                    <th>Result</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.target_id}</strong></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{r.sample_id}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{r.mn_grade !== null ? `${r.mn_grade}%` : '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{r.depth !== null ? `${r.depth} m` : '—'}</td>
                      <td>
                        <span className={`result-badge ${r.result}`}>
                          {r.result === 'confirmed' ? '✓' : r.result === 'not_found' ? '✕' : '△'}&nbsp;
                          {r.result === 'confirmed' ? 'Mn Confirmed' : r.result === 'not_found' ? 'Not Found' : 'Inconclusive'}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
