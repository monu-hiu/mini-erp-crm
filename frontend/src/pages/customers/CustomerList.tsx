import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Customer } from '../../types';

const statusClass: Record<string, string> = {
  LEAD: 'badge-lead',
  ACTIVE: 'badge-active',
  INACTIVE: 'badge-inactive',
};

export default function CustomerList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    const params: any = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;
    apiClient
      .get('/customers', { params })
      .then((res) => {
        setCustomers(res.data.customers);
        setTotal(res.data.pagination.total);
      })
      .finally(() => setLoading(false));
  }, [page, search, status]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearchParams({ ...(search && { search }), ...(status && { status }), page: '1' });
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title">Customers</h1>
        <Link to="/customers/new" className="btn">+ New Customer</Link>
      </div>

      <form className="toolbar" onSubmit={applyFilters}>
        <input
          placeholder="Search name, mobile, email, business…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button className="btn btn-secondary" type="submit">Apply</button>
      </form>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Business</th>
              <th>Mobile</th>
              <th>Type</th>
              <th>Status</th>
              <th>Follow-up</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="muted" style={{ padding: 20 }}>Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="muted" style={{ padding: 20 }}>No customers found.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/customers/${c.id}`}>{c.name}</Link></td>
                  <td>{c.businessName || '-'}</td>
                  <td>{c.mobile}</td>
                  <td>{c.customerType}</td>
                  <td><span className={`badge ${statusClass[c.status]}`}>{c.status}</span></td>
                  <td>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '-'}</td>
                  <td className="text-right"><Link to={`/customers/${c.id}`} className="btn btn-sm btn-secondary">View</Link></td>
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
