import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, getErrorMessage } from '../../api/client';

const emptyForm = {
  name: '',
  mobile: '',
  email: '',
  businessName: '',
  gstNumber: '',
  customerType: 'RETAIL',
  address: '',
  status: 'LEAD',
  followUpDate: '',
  notes: '',
};

export default function CustomerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      apiClient.get(`/customers/${id}`).then((res) => {
        const c = res.data.data;
        setForm({
          name: c.name,
          mobile: c.mobile,
          email: c.email || '',
          businessName: c.businessName || '',
          gstNumber: c.gstNumber || '',
          customerType: c.customerType,
          address: c.address || '',
          status: c.status,
          followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '',
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
      const payload = { ...form, followUpDate: form.followUpDate || undefined };
      if (isEdit) {
        await apiClient.put(`/customers/${id}`, payload);
        navigate(`/customers/${id}`);
      } else {
        const res = await apiClient.post('/customers', payload);
        navigate(`/customers/${res.data.data.id}`);
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
        <h1 className="page-title">{isEdit ? 'Edit Customer' : 'New Customer'}</h1>
      </div>
      <div className="card" style={{ maxWidth: 700 }}>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Customer Name *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Mobile *</label>
              <input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Business Name</label>
              <input value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>GST Number (optional)</label>
              <input value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Customer Type *</label>
              <select value={form.customerType} onChange={(e) => set('customerType', e.target.value)}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Follow-up Date</label>
              <input type="date" value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          {!isEdit && (
            <div className="form-group">
              <label>Initial Note (optional)</label>
              <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
