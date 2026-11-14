

import { useState } from 'react';
import { Building2, Lock, Mail } from 'lucide-react';
import { setAuthToken } from '../services/api';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setAuthToken(data.token);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f4f6fb',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <form onSubmit={handleLogin} style={{
        width: '100%',
        maxWidth: '400px',
        padding: '36px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Building2 size={38} color="#3156a3" />
          <h1 style={{ color: '#1e3155', marginBottom: '5px' }}>
            PARKZONE
          </h1>
          <p style={{ color: '#788399', margin: 0 }}>
            ERP REAL · Sign in to your workspace
          </p>
        </div>

        <label style={{ display: 'block', marginBottom: '8px' }}>
          Email address
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', border: '1px solid #dce2ec', borderRadius: '8px', padding: '0 12px' }}>
          <Mail size={17} color="#788399" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{ width: '100%', padding: '13px 0', border: 'none', outline: 'none' }}
          />
        </div>

        <label style={{ display: 'block', marginBottom: '8px' }}>
          Password
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', border: '1px solid #dce2ec', borderRadius: '8px', padding: '0 12px' }}>
          <Lock size={17} color="#788399" />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={{ width: '100%', padding: '13px 0', border: 'none', outline: 'none' }}
          />
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: '14px' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: '#3156a3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
