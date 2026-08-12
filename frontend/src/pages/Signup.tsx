import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

export default function Signup() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('SALES');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      await register(name, email, password, role);

      // After successful registration,
      // send the user to login.
      navigate('/login', {
        state: {
          message: 'Account created successfully. Please sign in.',
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>
          Create Account
        </h2>

        <p
          className="muted"
          style={{ marginBottom: 20 }}
        >
          Create your ERP account
        </p>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="form-group">
          <label>Name</label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm your password"
            required
          />
        </div>
        <div className="form-group">
  <label>Role</label>

  <select
    value={role}
    onChange={(e) => setRole(e.target.value)}
    required
  >
    <option value="SALES">Sales</option>
    <option value="WAREHOUSE">Warehouse</option>
    <option value="ACCOUNTS">Accounts</option>
      <option value="Admin">Admin</option>
  </select>

</div>

        <button
          className="btn"
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            marginTop: 10,
          }}
        >
          {isLoading
            ? 'Creating account…'
            : 'Create Account'}
        </button>

        <p
          className="muted"
          style={{
            marginTop: 16,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          Already have an account?{' '}
          <Link to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}