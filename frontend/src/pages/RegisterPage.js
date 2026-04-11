import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Train, Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import api from '../utils/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!/^[6-9]\d{9}$/.test(form.phone)) { setError('Enter a valid 10-digit Indian mobile number'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const Field = ({ label, icon, ...props }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 7, fontWeight: 500 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }}>{icon}</span>
        <input className="input-field" style={{ paddingLeft: 40 }} {...props} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at 70% 20%, rgba(59,130,246,0.07) 0%, transparent 50%)' }}>
      <div className="fade-up glass" style={{ width: '100%', maxWidth: 460, borderRadius: 24, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: 16, padding: 14, marginBottom: 14 }}>
            <Train size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: '#f1f5f9', marginBottom: 6 }}>Create Account</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Join IRCTC Rail Connect today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Full Name" icon={<User size={15} />} type="text" placeholder="Rajesh Kumar" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          <Field label="Email Address" icon={<Mail size={15} />} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          <Field label="Mobile Number" icon={<Phone size={15} />} type="tel" placeholder="9876543210" maxLength={10} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/,'') }))} required />

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 7, fontWeight: 500 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input className="input-field" style={{ paddingLeft: 40, paddingRight: 44 }}
                type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 7, fontWeight: 500 }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input className="input-field" style={{ paddingLeft: 40 }}
                type="password" placeholder="Re-enter password"
                value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>{error}</div>
          )}

          <button type="submit" className="btn-orange" style={{ width: '100%', padding: 14, fontSize: 15 }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Creating account...</> : 'Register & Get OTP →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#FF9933', fontWeight: 600, textDecoration: 'none' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
