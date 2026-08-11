import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiClient, getErrorMessage } from '../../api/client';
import { Challan } from '../../types';

export default function ChallanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  function reload() {
    apiClient.get(`/challans/${id}`).then((res) => setChallan(res.data.data)).finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [id]);

  async function confirm() {
    setError('');
    setActing(true);
    try {
      await apiClient.post(`/challans/${id}/confirm`);
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  }

  async function cancel() {
    if (!window.confirm('Cancel this challan? If confirmed, stock will be restored.')) return;
    setError('');
    setActing(true);
    try {
      await apiClient.post(`/challans/${id}/cancel`);
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActing(false);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!challan) return <p className="muted">Challan not found.</p>;

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title mono">{challan.challanNumber}</h1>
        <span className={`badge badge-${challan.status.toLowerCase()}`} style={{ fontSize: 14 }}>{challan.status}</span>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="form-row">
          <div><label>Customer</label><div>
            <Link to={`/customers/${challan.customer?.id}`}>{challan.customer?.name}</Link>
          </div></div>
          <div><label>Total Quantity</label><div>{challan.totalQuantity}</div></div>
          <div><label>Created</label><div>{new Date(challan.createdAt).toLocaleString()}</div></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Products</h3>
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Unit Price (at time of sale)</th><th>Qty</th><th>Line Total</th></tr></thead>
          <tbody>
            {challan.items.map((it) => (
              <tr key={it.id}>
                <td>{it.productNameSnapshot}</td>
                <td className="mono">{it.productSkuSnapshot}</td>
                <td className="mono">₹{Number(it.unitPriceSnapshot).toFixed(2)}</td>
                <td className="mono">{it.quantity}</td>
                <td className="mono">₹{(Number(it.unitPriceSnapshot) * it.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {challan.status === 'DRAFT' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Actions</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={confirm} disabled={acting}>
              {acting ? 'Confirming…' : 'Confirm Challan (reduce stock)'}
            </button>
            <button className="btn btn-danger" onClick={cancel} disabled={acting}>Cancel Challan</button>
          </div>
        </div>
      )}
      {challan.status === 'CONFIRMED' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Actions</h3>
          <button className="btn btn-danger" onClick={cancel} disabled={acting}>
            {acting ? 'Cancelling…' : 'Cancel Challan (restores stock)'}
          </button>
        </div>
      )}
    </div>
  );
}
