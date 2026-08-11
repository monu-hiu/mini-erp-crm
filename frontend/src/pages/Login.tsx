import { useState, FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

export default function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@erp.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>ERP</h2>
        <p className="muted" style={{ marginBottom: 20 }}>Sign in to continue</p>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn" type="submit" disabled={isLoading} style={{ width: '100%', marginTop: 10 }}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      <p
  className="muted"
  style={{
    marginTop: 16,
    fontSize: 13,
    textAlign: 'center',
  }}
>
  Don't have an account?{' '}
  <Link to="/signup">
    Create an account
  </Link>
</p>
      </form>
    </div>
  );
}
