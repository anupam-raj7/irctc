import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Train, Clock, ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CLASS_LABELS = { SL: 'Sleeper', '3A': 'AC 3 Tier', '2A': 'AC 2 Tier', '1A': 'AC 1st Class' };
const CLASS_COLORS = { SL: '#60a5fa', '3A': '#34d399', '2A': '#a78bfa', '1A': '#fbbf24' };

const SearchPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const date = params.get('date') || '';
  const cls = params.get('class') || 'SL';

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState(cls);

  useEffect(() => {
    if (from && to && date) fetchTrains();
  }, [from, to, date]);

  const fetchTrains = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/trains/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`);
      setTrains(res.data.trains || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search trains');
    } finally { setLoading(false); }
  };

  const handleBook = (train) => {
    if (!user) { navigate('/login'); return; }
    navigate(`/seat-select?trainId=${train.id}&date=${date}&class=${selectedClass}&trainName=${encodeURIComponent(train.train_name)}&trainNo=${train.train_number}`);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Search Summary */}
        <div className="glass" style={{ borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <MapPin size={16} color="#FF9933" />
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>{from}</span>
            <ArrowRight size={16} color="#475569" />
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>{to}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 14 }}>
            <Calendar size={14} />
            {formatDate(date)}
          </div>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="btn-outline" style={{ padding: '7px 16px', fontSize: 13 }}>Modify Search</button>
          </Link>
        </div>

        {/* Class Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(CLASS_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setSelectedClass(key)}
              style={{
                padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: '1.5px solid',
                borderColor: selectedClass === key ? CLASS_COLORS[key] : 'rgba(255,255,255,0.1)',
                background: selectedClass === key ? `${CLASS_COLORS[key]}20` : 'rgba(255,255,255,0.03)',
                color: selectedClass === key ? CLASS_COLORS[key] : '#64748b',
                transition: 'all 0.2s',
              }}>
              {key} — {label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px', borderWidth: 3 }} />
            <p style={{ color: '#64748b' }}>Searching trains...</p>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '16px 20px', color: '#f87171' }}>{error}</div>
        )}

        {!loading && !error && trains.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
            <h3 style={{ fontFamily: 'Rajdhani', fontSize: 24, color: '#f1f5f9', marginBottom: 8 }}>No Trains Found</h3>
            <p style={{ color: '#64748b' }}>No trains run between these stations on this date. Try a different date.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {trains.map(train => {
            const avail = train.availability?.[selectedClass];
            const isAvail = avail?.available > 0;
            return (
              <div key={train.id} className="glass card-hover" style={{ borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                  {/* Train Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ background: 'linear-gradient(135deg,#FF9933,#ea580c)', borderRadius: 8, padding: '4px 8px' }}>
                        <Train size={14} color="white" />
                      </div>
                      <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: '#f1f5f9' }}>{train.train_name}</span>
                      <span style={{ fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 6 }}>#{train.train_number}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#94a3b8' }}>
                      <Clock size={13} />
                      <span style={{ fontWeight: 700, fontSize: 20, color: '#f1f5f9', fontFamily: 'Rajdhani' }}>{train.departure_time?.slice(0,5)}</span>
                      <span>→</span>
                      <span style={{ fontWeight: 700, fontSize: 20, color: '#f1f5f9', fontFamily: 'Rajdhani' }}>{train.arrival_time?.slice(0,5)}</span>
                      <span style={{ color: '#64748b' }}>({train.duration})</span>
                    </div>
                  </div>

                  {/* Availability */}
                  <div style={{ textAlign: 'center', minWidth: 120 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{CLASS_LABELS[selectedClass]}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <Users size={14} color={isAvail ? '#22c55e' : '#ef4444'} />
                      <span style={{ fontWeight: 700, fontSize: 16, color: isAvail ? '#22c55e' : '#ef4444' }}>
                        {isAvail ? `${avail.available} AVBL` : 'WL'}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'center', minWidth: 100 }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>From</div>
                    <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 24, color: '#fbbf24' }}>
                      ₹{avail?.price?.toLocaleString('en-IN') || '—'}
                    </div>
                  </div>

                  {/* Book Button */}
                  <button className="btn-orange" style={{ padding: '11px 24px', minWidth: 120, opacity: isAvail ? 1 : 0.5 }}
                    onClick={() => isAvail && handleBook(train)} disabled={!isAvail}>
                    {isAvail ? 'Book Now' : 'Waitlist'}
                  </button>
                </div>

                {/* Days */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 6 }}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <span key={d} style={{
                      fontSize: 11, padding: '2px 7px', borderRadius: 5,
                      background: train.days_of_operation?.includes(d) ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
                      color: train.days_of_operation?.includes(d) ? '#4ade80' : '#334155',
                      border: `1px solid ${train.days_of_operation?.includes(d) ? 'rgba(34,197,94,0.3)' : 'transparent'}`,
                    }}>{d}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
