import { useEffect, useState, FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient, getErrorMessage } from '../../api/client';
import { Customer } from '../../types';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function reload() {
    apiClient.get(`/customers/${id}`).then((res) => setCustomer(res.data.data)).finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [id]);

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setError('');
    try {
      await apiClient.post(`/customers/${id}/notes`, { note: noteText });
      setNoteText('');
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!customer) return <p className="muted">Customer not found.</p>;

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title">{customer.name}</h1>
        <Link to={`/customers/${customer.id}/edit`} className="btn btn-secondary">Edit</Link>
      </div>

      <div className="card">
        <div className="form-row">
          <div><label>Mobile</label><div>{customer.mobile}</div></div>
          <div><label>Email</label><div>{customer.email || '-'}</div></div>
          <div><label>Business</label><div>{customer.businessName || '-'}</div></div>
        </div>
        <div className="form-row" style={{ marginTop: 12 }}>
          <div><label>GST Number</label><div>{customer.gstNumber || '-'}</div></div>
          <div><label>Type</label><div>{customer.customerType}</div></div>
          <div><label>Status</label><div><span className={`badge badge-${customer.status.toLowerCase()}`}>{customer.status}</span></div></div>
        </div>
        <div className="form-row" style={{ marginTop: 12 }}>
          <div><label>Follow-up Date</label><div>{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : '-'}</div></div>
          <div><label>Address</label><div>{customer.address || '-'}</div></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Related Challans</h3>
        {!customer.challans || customer.challans.length === 0 ? (
          <p className="muted">No challans yet for this customer.</p>
        ) : (
          <table>
            <thead><tr><th>Challan #</th><th>Status</th><th>Total Qty</th></tr></thead>
            <tbody>
              {customer.challans.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
                  <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td>{c.totalQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Follow-up Notes</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={addNote} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            style={{ flex: 1 }}
            placeholder="Add a follow-up note…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <button className="btn" type="submit">Add Note</button>
        </form>
        {(customer.notes || []).length === 0 ? (
          <p className="muted">No notes yet.</p>
        ) : (
          <div>
            {customer.notes!.map((n) => (
              <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>{n.note}</div>
                <div className="muted">{n.createdBy?.name} · {new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
