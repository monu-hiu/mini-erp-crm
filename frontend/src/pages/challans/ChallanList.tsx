import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Challan } from '../../types';

export default function ChallanList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    const params: any = { page, limit };
    if (status) params.status = status;
    apiClient.get('/challans', { params }).then((res) => {
      setChallans(res.data.challans);
      setTotal(res.data.pagination.total);
    }).finally(() => setLoading(false));
  }, [page, status]);

  function applyFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearchParams({ ...(status && { status }) });
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title">Sales Challans</h1>
        <Link to="/challans/new" className="btn">+ New Challan</Link>
      </div>

      <form className="toolbar" onSubmit={applyFilter}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="btn btn-secondary" type="submit">Apply</button>
      </form>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Challan #</th><th>Customer</th><th>Total Qty</th><th>Status</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="muted" style={{ padding: 20 }}>Loading…</td></tr>
            ) : challans.length === 0 ? (
              <tr><td colSpan={6} className="muted" style={{ padding: 20 }}>No challans found.</td></tr>
            ) : (
              challans.map((c) => (
                <tr key={c.id}>
                  <td className="mono"><Link to={`/challans/${c.id}`}>{c.challanNumber}</Link></td>
                  <td>{c.customer?.name} {c.customer?.businessName ? `(${c.customer.businessName})` : ''}</td>
                  <td className="mono">{c.totalQuantity}</td>
                  <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="text-right"><Link to={`/challans/${c.id}`} className="btn btn-sm btn-secondary">View</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {page} of {totalPages} ({total} total)</span>
        <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
