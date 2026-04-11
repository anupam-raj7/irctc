import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, MapPin, Calendar, Search, Shield, Zap, Star } from 'lucide-react';

const STATIONS = [
  'New Delhi','Howrah Junction','Mumbai Central','Chennai Central',
  'Bengaluru City','Hazrat Nizamuddin','Sealdah','Amritsar Junction',
  'Ahmedabad','Hyderabad','Pune','Patna Junction','Lucknow',
  'Varanasi','Agra Cantt','Jaipur','Bhopal Junction',
];

const HomePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ from: '', to: '', date: '', cls: 'SL' });
  const [error, setError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!form.from || !form.to || !form.date) { setError('Please fill all fields'); return; }
    if (form.from === form.to) { setError('Source and destination cannot be same'); return; }
    navigate(`/search?from=${encodeURIComponent(form.from)}&to=${encodeURIComponent(form.to)}&date=${form.date}&class=${form.cls}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #080812 0%, #0d0d2b 40%, #1a0a00 100%)',
        padding: '80px 24px 100px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,153,51,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

        {/* Animated train */}
        <div style={{ position: 'absolute', top: 30, left: 0, right: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ animation: 'trainSlide 12s linear infinite', display: 'inline-block', fontSize: 28, opacity: 0.15 }}>
            🚂💨
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="fade-up" style={{ marginBottom: 16 }}>
            <span style={{
              background: 'rgba(255,153,51,0.12)', border: '1px solid rgba(255,153,51,0.25)',
              borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#fbbf24', fontWeight: 500,
            }}>
              🇮🇳 India's #1 Rail Booking Platform
            </span>
          </div>

          <h1 className="fade-up shimmer-text" style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 1.1,
            marginBottom: 20, animationDelay: '0.1s',
          }}>
            Book Train Tickets<br />Across India
          </h1>

          <p className="fade-up" style={{
            color: '#94a3b8', fontSize: 18, maxWidth: 520, margin: '0 auto 48px',
            animationDelay: '0.2s', lineHeight: 1.6,
          }}>
            Fast, secure, and reliable. Search from 13,000+ trains and book your journey in minutes.
          </p>

          {/* Search Box */}
          <div className="fade-up glass" style={{
            borderRadius: 20, padding: 32, maxWidth: 800, margin: '0 auto',
            animationDelay: '0.3s',
          }}>
            <form onSubmit={handleSearch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <MapPin size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />From Station
                  </label>
                  <select
                    className="input-field"
                    value={form.from}
                    onChange={e => setForm(p => ({ ...p, from: e.target.value }))}
                    style={{ appearance: 'none' }}
                  >
                    <option value="">Select Origin</option>
                    {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <MapPin size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />To Station
                  </label>
                  <select
                    className="input-field"
                    value={form.to}
                    onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                    style={{ appearance: 'none' }}
                  >
                    <option value="">Select Destination</option>
                    {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <Calendar size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />Date of Journey
                  </label>
                  <input
                    type="date" className="input-field"
                    value={form.date} min={today}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🪑 Class
                  </label>
                  <select className="input-field" value={form.cls} onChange={e => setForm(p => ({ ...p, cls: e.target.value }))} style={{ appearance: 'none' }}>
                    <option value="SL">Sleeper (SL)</option>
                    <option value="3A">AC 3 Tier (3A)</option>
                    <option value="2A">AC 2 Tier (2A)</option>
                    <option value="1A">AC First Class (1A)</option>
                  </select>
                </div>
              </div>

              {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

              <button type="submit" className="btn-orange" style={{ width: '100%', padding: '14px', fontSize: 16 }}>
                <Search size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Search Trains
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 36, marginBottom: 48, color: '#f1f5f9' }}>
          Why Choose <span className="shimmer-text">Rail Connect</span>?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {[
            { icon: <Zap size={28} color="#FF9933" />, title: 'Instant Booking', desc: 'Book tickets in under 60 seconds with our streamlined checkout process.' },
            { icon: <Shield size={28} color="#22c55e" />, title: 'Secure Payments', desc: 'UPI, Credit/Debit cards, Netbanking — all secured with 256-bit encryption.' },
            { icon: <Star size={28} color="#fbbf24" />, title: 'Easy Cancellations', desc: 'Cancel anytime and get automatic refunds based on our transparent policy.' },
          ].map((f, i) => (
            <div key={i} className="glass card-hover" style={{ borderRadius: 16, padding: 28 }}>
              <div style={{ marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, marginBottom: 10, color: '#f1f5f9' }}>{f.title}</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: 'rgba(255,153,51,0.04)', borderTop: '1px solid rgba(255,153,51,0.1)', borderBottom: '1px solid rgba(255,153,51,0.1)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {[['13,000+', 'Trains'], ['7,000+', 'Stations'], ['10M+', 'Passengers'], ['99.9%', 'Uptime']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 32, color: '#FF9933' }}>{val}</div>
              <div style={{ color: '#64748b', fontSize: 14 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '32px', color: '#334155', fontSize: 13 }}>
        © 2024 IRCTC Rail Connect · Made with ❤️ for India
      </footer>
    </div>
  );
};

export default HomePage;
