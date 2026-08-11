import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Stats {
  customers: number;
  activeCustomers: number;
  products: number;
  lowStockProducts: number;
  draftChallans: number;
  confirmedChallans: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [customers, activeCustomers, products, lowStock, draft, confirmed] = await Promise.all([
        apiClient.get('/customers?limit=1'),
        apiClient.get('/customers?limit=1&status=ACTIVE'),
        apiClient.get('/products?limit=1'),
        apiClient.get('/products?limit=1&lowStockOnly=true'),
        apiClient.get('/challans?limit=1&status=DRAFT'),
        apiClient.get('/challans?limit=1&status=CONFIRMED'),
      ]);
      setStats({
        customers: customers.data.pagination.total,
        activeCustomers: activeCustomers.data.pagination.total,
        products: products.data.pagination.total,
        lowStockProducts: lowStock.data.pagination.total,
        draftChallans: draft.data.pagination.total,
        confirmedChallans: confirmed.data.pagination.total,
      });
      setLoading(false);
    }
    loadStats().catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title">Dashboard</h1>
      </div>
      <p className="muted" style={{ marginTop: -10, marginBottom: 20 }}>
        Welcome back, {user?.name || user?.email} ({user?.role})
      </p>

      {loading || !stats ? (
        <p className="muted">Loading stats…</p>
      ) : (
        <div className="stat-grid">
          <Link to="/customers" className="stat-card">
            <div className="stat-value">{stats.customers}</div>
            <div className="stat-label">Total Customers</div>
          </Link>
          <Link to="/customers?status=ACTIVE" className="stat-card">
            <div className="stat-value">{stats.activeCustomers}</div>
            <div className="stat-label">Active Customers</div>
          </Link>
          <Link to="/products" className="stat-card">
            <div className="stat-value">{stats.products}</div>
            <div className="stat-label">Products</div>
          </Link>
          <Link to="/products?lowStockOnly=true" className="stat-card">
            <div className="stat-value" style={{ color: stats.lowStockProducts > 0 ? '#dc2626' : undefined }}>
              {stats.lowStockProducts}
            </div>
            <div className="stat-label">Low Stock Alerts</div>
          </Link>
          <Link to="/challans?status=DRAFT" className="stat-card">
            <div className="stat-value">{stats.draftChallans}</div>
            <div className="stat-label">Draft Challans</div>
          </Link>
          <Link to="/challans?status=CONFIRMED" className="stat-card">
            <div className="stat-value">{stats.confirmedChallans}</div>
            <div className="stat-label">Confirmed Challans</div>
          </Link>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Quick actions</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/customers/new" className="btn">+ New Customer</Link>
          <Link to="/products/new" className="btn btn-secondary">+ New Product</Link>
          <Link to="/challans/new" className="btn btn-secondary">+ New Challan</Link>
        </div>
      </div>
    </div>
  );
}
