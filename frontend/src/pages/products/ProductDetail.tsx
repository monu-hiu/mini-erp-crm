import { useEffect, useState, FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient, getErrorMessage } from '../../api/client';
import { Product } from '../../types';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movement, setMovement] = useState({ quantity: '', movementType: 'IN', reason: '' });
  const [saving, setSaving] = useState(false);

  function reload() {
    apiClient.get(`/products/${id}`).then((res) => setProduct(res.data.data)).finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [id]);

  async function submitMovement(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await apiClient.post(`/products/${id}/stock-movement`, movement);
      setMovement({ quantity: '', movementType: 'IN', reason: '' });
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!product) return <p className="muted">Product not found.</p>;

  const low = product.currentStock <= product.minStockAlert;

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title">{product.name}</h1>
        <Link to={`/products/${product.id}/edit`} className="btn btn-secondary">Edit Details</Link>
      </div>

      <div className="card">
        <div className="form-row">
          <div><label>SKU</label><div className="mono">{product.sku}</div></div>
          <div><label>Category</label><div>{product.category || '-'}</div></div>
          <div><label>Unit Price</label><div className="mono">₹{Number(product.unitPrice).toFixed(2)}</div></div>
        </div>
        <div className="form-row" style={{ marginTop: 12 }}>
          <div>
            <label>Current Stock</label>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: low ? 'var(--danger)' : undefined }}>
              {product.currentStock} {low && '⚠ Low stock'}
            </div>
          </div>
          <div><label>Min Alert Qty</label><div className="mono">{product.minStockAlert}</div></div>
          <div><label>Location</label><div>{product.location || '-'}</div></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Record Stock Movement</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={submitMovement} className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group">
            <label>Type</label>
            <select value={movement.movementType} onChange={(e) => setMovement((m) => ({ ...m, movementType: e.target.value }))}>
              <option value="IN">Stock IN</option>
              <option value="OUT">Stock OUT</option>
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" min="1" required value={movement.quantity} onChange={(e) => setMovement((m) => ({ ...m, quantity: e.target.value }))} />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Reason</label>
            <input required placeholder="e.g. Purchase order received, damaged stock…" value={movement.reason} onChange={(e) => setMovement((m) => ({ ...m, reason: e.target.value }))} />
          </div>
          <div className="form-group">
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record'}</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Stock Movement Log</h3>
        {(product.stockMovements || []).length === 0 ? (
          <p className="muted">No movements recorded yet.</p>
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Reason</th><th>By</th></tr></thead>
            <tbody>
              {product.stockMovements!.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                  <td><span className={`badge ${m.movementType === 'IN' ? 'badge-active' : 'badge-cancelled'}`}>{m.movementType}</span></td>
                  <td>{m.quantityChanged}</td>
                  <td>{m.reason}</td>
                  <td>{m.createdBy?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
