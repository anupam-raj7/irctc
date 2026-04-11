import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Train, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/search');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      if (err.response?.data?.needsVerification) {
        navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at 30% 20%, rgba(255,153,51,0.07) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.07) 0%, transparent 50%)' }}>
      <div className="fade-up glass" style={{ width: '100%', maxWidth: 420, borderRadius: 24, padding: 40 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg,#FF9933,#ea580c)', borderRadius: 16, padding: 14, marginBottom: 16 }}>
            <Train size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: '#f1f5f9', marginBottom: 6 }}>Welcome Back</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Login to IRCTC Rail Connect</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 7, fontWeight: 500 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input className="input-field" style={{ paddingLeft: 40 }} type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 7, fontWeight: 500 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input className="input-field" style={{ paddingLeft: 40, paddingRight: 44 }}
                type={showPass ? 'text' : 'password'} placeholder="Your password"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-orange" style={{ width: '100%', padding: 14, fontSize: 15 }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Logging in...</> : 'Login →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#FF9933', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: 20, background: 'rgba(255,153,51,0.06)', border: '1px solid rgba(255,153,51,0.15)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ fontSize: 12, color: '#92400e', textAlign: 'center' }}>
            🧪 <strong style={{ color: '#fbbf24' }}>Demo:</strong> Register with any email to get OTP
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
