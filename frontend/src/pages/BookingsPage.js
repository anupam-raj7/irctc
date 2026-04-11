import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Train, Ticket, XCircle, CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react';
import api from '../utils/api';

const STATUS_STYLES = {
  CONFIRMED: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#4ade80', icon: <CheckCircle size={14} /> },
  CANCELLED: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#f87171', icon: <XCircle size={14} /> },
  WAITING:   { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24', icon: <Clock size={14} /> },
};

const BookingsPage = () => {
  const { state } = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(null); // booking to cancel
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);
  const [expanded, setExpanded] = useState(state?.newPnr || null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data.bookings || []);
    } catch { } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      const res = await api.post(`/bookings/${cancelModal.id}/cancel`);
      setCancelResult(res.data);
      await fetchBookings();
    } catch (err) {
      setCancelResult({ error: err.response?.data?.error || 'Cancellation failed' });
    } finally { setCancelling(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 32, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Ticket size={28} color="#FF9933" /> My Tickets
          </h1>
          <button onClick={fetchBookings} className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>↻ Refresh</button>
        </div>

        {/* New booking highlight */}
        {state?.newPnr && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={20} color="#4ade80" />
            <div>
              <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: 2 }}>Booking Confirmed!</p>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>PNR: <strong style={{ color: '#fbbf24', fontFamily: 'Rajdhani', fontSize: 16, letterSpacing: 1 }}>{state.newPnr}</strong></p>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px', borderWidth: 3 }} />
            <p style={{ color: '#64748b' }}>Loading your tickets...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass" style={{ borderRadius: 20, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎫</div>
            <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 24, color: '#f1f5f9', marginBottom: 8 }}>No Bookings Yet</h3>
            <p style={{ color: '#64748b', marginBottom: 20 }}>Your booked tickets will appear here.</p>
            <a href="/search"><button className="btn-orange" style={{ padding: '11px 28px' }}>Book Your First Train</button></a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map(booking => {
              const statusStyle = STATUS_STYLES[booking.booking_status] || STATUS_STYLES.CONFIRMED;
              const isExpanded = expanded === booking.pnr_number;

              return (
                <div key={booking.id} className="glass card-hover" style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.06)` }}>
                  {/* Header */}
                  <div style={{ padding: '18px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}
                    onClick={() => setExpanded(isExpanded ? null : booking.pnr_number)}>
                    <div style={{ background: 'linear-gradient(135deg,#FF9933,#ea580c)', borderRadius: 10, padding: '8px 10px' }}>
                      <Train size={18} color="white" />
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: '#f1f5f9', marginBottom: 2 }}>
                        {booking.trains?.train_name || 'Train'}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        {booking.from_station} → {booking.to_station}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>PNR</div>
                      <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16, color: '#fbbf24', letterSpacing: 1 }}>{booking.pnr_number}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Journey</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{formatDate(booking.journey_date)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, borderRadius: 20, padding: '5px 12px', fontSize: 12, color: statusStyle.color, fontWeight: 600 }}>
                      {statusStyle.icon} {booking.booking_status}
                    </div>
                    <div style={{ color: '#475569', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
                        {[
                          ['Train No.', booking.trains?.train_number],
                          ['Class', booking.coach_type],
                          ['Seats', booking.seats_booked?.join(', ')],
                          ['Amount Paid', `₹${booking.total_amount?.toLocaleString('en-IN')}`],
                          ['Payment', booking.payment_status],
                          ['Booked On', formatDate(booking.created_at)],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <div style={{ fontSize: 11, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                            <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500 }}>{value || '—'}</div>
                          </div>
                        ))}
                      </div>

                      {/* Passengers */}
                      {booking.passenger_details?.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Passengers</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {booking.passenger_details.map((p, i) => (
                              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', fontSize: 13 }}>
                                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{p.name}</span>
                                <span style={{ color: '#64748b' }}> · {p.age}y · {p.gender}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Refund info */}
                      {booking.booking_status === 'CANCELLED' && booking.refund_amount > 0 && (
                        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle size={14} />
                          Refund of ₹{booking.refund_amount?.toLocaleString('en-IN')} initiated (5-7 business days)
                        </div>
                      )}

                      {/* Cancel Button */}
                      {booking.booking_status === 'CONFIRMED' && (
                        <button onClick={() => { setCancelModal(booking); setCancelResult(null); }}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '9px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                          <XCircle size={14} /> Cancel Ticket
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div className="glass fade-up" style={{ borderRadius: 20, padding: 36, maxWidth: 420, width: '100%' }}>
            {!cancelResult ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <AlertTriangle size={40} color="#fbbf24" style={{ marginBottom: 12 }} />
                  <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 24, color: '#f1f5f9', marginBottom: 8 }}>Cancel Ticket?</h3>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
                    PNR: <strong style={{ color: '#fbbf24' }}>{cancelModal.pnr_number}</strong><br />
                    {cancelModal.from_station} → {cancelModal.to_station}<br />
                    Journey: {formatDate(cancelModal.journey_date)}
                  </p>
                </div>
                <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#fbbf24' }}>
                  <strong>Refund Policy:</strong><br />
                  &gt; 48hrs: 90% refund · &gt; 24hrs: 75% · &gt; 4hrs: 50% · &lt; 4hrs: No refund
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button className="btn-outline" onClick={() => setCancelModal(null)} style={{ padding: 12 }}>Keep Ticket</button>
                  <button onClick={handleCancel} disabled={cancelling}
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans', opacity: cancelling ? 0.7 : 1 }}>
                    {cancelling ? <><span className="spinner" style={{ marginRight: 6 }} />Cancelling...</> : 'Yes, Cancel'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                {cancelResult.error ? (
                  <>
                    <XCircle size={48} color="#ef4444" style={{ marginBottom: 12 }} />
                    <h3 style={{ color: '#f87171', fontFamily: 'Rajdhani', fontSize: 24, marginBottom: 8 }}>Cancellation Failed</h3>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>{cancelResult.error}</p>
                  </>
                ) : (
                  <>
                    <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 12 }} />
                    <h3 style={{ color: '#4ade80', fontFamily: 'Rajdhani', fontSize: 24, marginBottom: 8 }}>Ticket Cancelled</h3>
                    <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>{cancelResult.message}</p>
                    {cancelResult.refundAmount > 0 && (
                      <p style={{ color: '#fbbf24', fontWeight: 700, fontSize: 18 }}>Refund: ₹{cancelResult.refundAmount?.toLocaleString('en-IN')}</p>
                    )}
                    <p style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{cancelResult.refundNote}</p>
                  </>
                )}
                <button className="btn-orange" onClick={() => { setCancelModal(null); setCancelResult(null); }} style={{ marginTop: 20, padding: '10px 28px' }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
