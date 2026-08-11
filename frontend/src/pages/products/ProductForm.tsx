import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, getErrorMessage } from '../../api/client';

const emptyForm = {
  name: '', sku: '', category: '', unitPrice: '', currentStock: '0', minStockAlert: '0', location: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      apiClient.get(`/products/${id}`).then((res) => {
        const p = res.data.data;
        setForm({
          name: p.name, sku: p.sku, category: p.category || '', unitPrice: String(p.unitPrice),
          currentStock: String(p.currentStock), minStockAlert: String(p.minStockAlert), location: p.location || '',
        });
      });
    }
  }, [id, isEdit]);

  function set(field: string, value: string) {
    setForm((f: any) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        const { currentStock, ...rest } = form; // stock is edited only via stock-movement endpoint
        await apiClient.put(`/products/${id}`, rest);
        navigate(`/products/${id}`);
      } else {
        const res = await apiClient.post('/products', form);
        navigate(`/products/${res.data.data.id}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>
      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>SKU / Code *</label>
              <input value={form.sku} onChange={(e) => set('sku', e.target.value)} required disabled={isEdit} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input value={form.category} onChange={(e) => set('category', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Unit Price *</label>
              <input type="number" step="0.01" min="0" value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            {!isEdit && (
              <div className="form-group">
                <label>Opening Stock</label>
                <input type="number" min="0" value={form.currentStock} onChange={(e) => set('currentStock', e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label>Minimum Stock Alert Qty</label>
              <input type="number" min="0" value={form.minStockAlert} onChange={(e) => set('minStockAlert', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Location / Warehouse</label>
            <input value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
          {isEdit && (
            <p className="muted">Stock quantity is changed via "Record Stock Movement" on the product page, not here.</p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
