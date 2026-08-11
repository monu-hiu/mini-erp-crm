import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Product } from '../../types';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStockOnly') === 'true');
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    const params: any = { page, limit };
    if (search) params.search = search;
    if (lowStockOnly) params.lowStockOnly = true;
    apiClient
      .get('/products', { params })
      .then((res) => {
        setProducts(res.data.products);
        setTotal(res.data.pagination.total);
      })
      .finally(() => setLoading(false));
  }, [page, search, lowStockOnly]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearchParams({ ...(search && { search }), ...(lowStockOnly && { lowStockOnly: 'true' }) });
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title">Products &amp; Inventory</h1>
        <Link to="/products/new" className="btn">+ New Product</Link>
      </div>

      <form className="toolbar" onSubmit={applyFilters}>
        <input placeholder="Search name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
        <button className="btn btn-secondary" type="submit">Apply</button>
      </form>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Location</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="muted" style={{ padding: 20 }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="muted" style={{ padding: 20 }}>No products found.</td></tr>
            ) : (
              products.map((p) => {
                const low = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p.id}>
                    <td><Link to={`/products/${p.id}`}>{p.name}</Link></td>
                    <td className="mono">{p.sku}</td>
                    <td>{p.category || '-'}</td>
                    <td className="mono">₹{Number(p.unitPrice).toFixed(2)}</td>
                    <td className="mono" style={{ color: low ? 'var(--danger)' : undefined, fontWeight: low ? 700 : undefined }}>
                      {p.currentStock} {low && '⚠'}
                    </td>
                    <td>{p.location || '-'}</td>
                    <td className="text-right"><Link to={`/products/${p.id}`} className="btn btn-sm btn-secondary">Manage</Link></td>
                  </tr>
                );
              })
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
