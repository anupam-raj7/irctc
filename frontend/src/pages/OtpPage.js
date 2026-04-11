import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const OtpPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const { login } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
    const timer = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      refs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code });
      login(res.data.token, res.data.user);
      setSuccess('Account verified! Redirecting...');
      setTimeout(() => navigate('/search'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true); setError('');
    try {
      await api.post('/auth/resend-otp', { email });
      setSuccess('New OTP sent!');
      setCountdown(60);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend');
    } finally { setResending(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fade-up glass" style={{ width: '100%', maxWidth: 420, borderRadius: 24, padding: 40, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Mail size={30} color="white" />
        </div>

        <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: '#f1f5f9', marginBottom: 8 }}>Verify Your Email</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 6 }}>We sent a 6-digit OTP to</p>
        <p style={{ color: '#fbbf24', fontWeight: 600, fontSize: 15, marginBottom: 32 }}>{email}</p>

        {/* OTP Boxes */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input key={i} ref={el => refs.current[i] = el}
              style={{
                width: 52, height: 60, textAlign: 'center', fontSize: 24, fontWeight: 700,
                fontFamily: 'Rajdhani', background: 'rgba(255,255,255,0.05)',
                border: `2px solid ${d ? '#FF9933' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 12, color: '#f1f5f9', outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: d ? '0 0 12px rgba(255,153,51,0.3)' : 'none',
              }}
              maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
            />
          ))}
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#4ade80' }}>{success}</div>}

        <button className="btn-orange" style={{ width: '100%', padding: 14, fontSize: 15, marginBottom: 16 }}
          onClick={handleVerify} disabled={loading}>
          {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Verifying...</> : 'Verify OTP ✓'}
        </button>

        <button onClick={handleResend} disabled={countdown > 0 || resending}
          style={{ background: 'none', border: 'none', cursor: countdown > 0 ? 'default' : 'pointer', color: countdown > 0 ? '#475569' : '#FF9933', fontSize: 14, fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
          <RefreshCw size={14} />
          {countdown > 0 ? `Resend OTP in ${countdown}s` : resending ? 'Sending...' : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
};

export default OtpPage;
