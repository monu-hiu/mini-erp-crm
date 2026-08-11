import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, getErrorMessage } from '../../api/client';
import { Customer, Product } from '../../types';

interface LineItem { productId: string; quantity: string; }

export default function ChallanForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: '1' }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/customers', { params: { limit: 100 } }).then((res) => setCustomers(res.data.customers));
    apiClient.get('/products', { params: { limit: 100 } }).then((res) => setProducts(res.data.products));
  }, []);

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function addLine() {
    setItems((prev) => [...prev, { productId: '', quantity: '1' }]);
  }

  function removeLine(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: FormEvent, status: 'DRAFT' | 'CONFIRMED') {
    e.preventDefault();
    setError('');
    if (!customerId) return setError('Please select a customer.');
    const validItems = items.filter((it) => it.productId && Number(it.quantity) > 0);
    if (validItems.length === 0) return setError('Add at least one product with a quantity.');

    setSaving(true);
    try {
      const res = await apiClient.post('/challans', {
        customerId: Number(customerId),
        status,
        items: validItems.map((it) => ({ productId: Number(it.productId), quantity: Number(it.quantity) })),
      });
      navigate(`/challans/${res.data.data.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <h1 className="page-title">New Sales Challan</h1>
      </div>
      <div className="card" style={{ maxWidth: 800 }}>
        {error && <div className="error-banner">{error}</div>}
        <form>
          <div className="form-group">
            <label>Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` — ${c.businessName}` : ''}</option>
              ))}
            </select>
          </div>

          <label>Products *</label>
          {items.map((item, i) => {
            const selected = products.find((p) => p.id === Number(item.productId));
            return (
              <div className="form-row" key={i} style={{ alignItems: 'flex-end', marginTop: 8 }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <select value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)}>
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {p.currentStock} in stock</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ maxWidth: 120 }}>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} placeholder="Qty" />
                </div>
                {selected && (
                  <div className="muted" style={{ paddingBottom: 8 }}>
                    ₹{Number(selected.unitPrice).toFixed(2)} each
                  </div>
                )}
                <div className="form-group">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeLine(i)} disabled={items.length === 1}>Remove</button>
                </div>
              </div>
            );
          })}
          <button type="button" className="btn btn-secondary btn-sm" onClick={addLine} style={{ marginTop: 10 }}>+ Add product line</button>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={(e) => submit(e, 'DRAFT')} disabled={saving}>
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button className="btn" onClick={(e) => submit(e, 'CONFIRMED')} disabled={saving}>
              {saving ? 'Saving…' : 'Save & Confirm'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            "Save &amp; Confirm" immediately reduces stock. If any product has insufficient stock, the whole confirmation is rejected.
          </p>
        </form>
      </div>
    </div>
  );
}
