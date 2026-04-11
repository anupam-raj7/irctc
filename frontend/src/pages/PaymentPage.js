import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Smartphone, CreditCard, Building2, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const UPI_APPS = [
  { name: 'GPay', emoji: '🔵', color: '#4285F4' },
  { name: 'PhonePe', emoji: '🟣', color: '#5F259F' },
  { name: 'Paytm', emoji: '🔷', color: '#00B9F1' },
  { name: 'BHIM', emoji: '🟠', color: '#FF6600' },
];

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'];

const PaymentPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const bookingData = state?.bookingData;

  const [method, setMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [selectedApp, setSelectedApp] = useState('');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [selectedBank, setSelectedBank] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // 'processing' | 'success' | 'failed'
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingData) navigate('/search');
  }, []);

  const totalAmount = bookingData ? Math.round((bookingData.totalAmount || 0) * 1.05) : 0;

  // UPI countdown timer
  useEffect(() => {
    if (status === 'processing' && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (status === 'processing' && countdown === 0) completePayment();
  }, [status, countdown]);

  const initiatePayment = async () => {
    setError('');
    if (method === 'UPI' && !upiId && !selectedApp) { setError('Enter UPI ID or select an app'); return; }
    if (method === 'CARD' && (!card.number || !card.name || !card.expiry || !card.cvv)) { setError('Fill all card details'); return; }
    if (method === 'NETBANKING' && !selectedBank) { setError('Select a bank'); return; }

    setLoading(true);
    try {
      const orderRes = await api.post('/payments/initiate', { amount: totalAmount, booking_data: bookingData });
      setLoading(false);
      setStatus('processing');
      setCountdown(method === 'UPI' ? 5 : 3);
    } catch (err) {
      setLoading(false);
      setError('Payment initiation failed. Try again.');
    }
  };

  const completePayment = async () => {
    try {
      const verifyRes = await api.post('/payments/verify', {
        order_id: `ORDER_${Date.now()}`,
        payment_method: method,
        booking_data: bookingData,
      });

      if (verifyRes.data.success) {
        // Create booking
        const bookingRes = await api.post('/bookings/create', {
          train_id: bookingData.trainId,
          journey_date: bookingData.date,
          coach_type: bookingData.coachType,
          seats: bookingData.seats,
          passenger_details: bookingData.passengers,
          total_amount: totalAmount,
          payment_method: method,
          payment_id: verifyRes.data.transactionRef,
        });

        setStatus('success');
        setTimeout(() => navigate('/bookings', { state: { newPnr: bookingRes.data.pnr } }), 2000);
      } else {
        setStatus('failed');
      }
    } catch (err) {
      console.error(err);
      setStatus('failed');
    }
  };

  const formatCard = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  if (!bookingData) return null;

  // Processing screen
  if (status === 'processing') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fade-up glass" style={{ borderRadius: 24, padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, margin: '0 auto 24px', position: 'relative' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid rgba(255,153,51,0.2)', position: 'absolute' }} />
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#FF9933', animation: 'spin 1s linear infinite', position: 'absolute' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {method === 'UPI' ? '📱' : '💳'}
          </div>
        </div>
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 26, color: '#f1f5f9', marginBottom: 10 }}>
          {method === 'UPI' ? 'Waiting for UPI Payment' : 'Processing Payment'}
        </h2>
        {method === 'UPI' && (
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
            Complete the payment on your <strong style={{ color: '#fbbf24' }}>UPI app</strong>
          </p>
        )}
        <div style={{ fontFamily: 'Rajdhani', fontSize: 48, fontWeight: 700, color: '#FF9933', marginBottom: 8 }}>
          {countdown}
        </div>
        <p style={{ color: '#475569', fontSize: 13 }}>Seconds remaining…</p>
        <div style={{ background: 'rgba(255,153,51,0.08)', border: '1px solid rgba(255,153,51,0.2)', borderRadius: 12, padding: 14, marginTop: 20 }}>
          <p style={{ color: '#fbbf24', fontSize: 15, fontWeight: 700 }}>₹{totalAmount.toLocaleString('en-IN')}</p>
          <p style={{ color: '#94a3b8', fontSize: 12 }}>being processed via {method}</p>
        </div>
        <p style={{ color: '#334155', fontSize: 12, marginTop: 16 }}>🔒 Secured by 256-bit SSL encryption</p>
      </div>
    </div>
  );

  // Success screen
  if (status === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fade-up" style={{ textAlign: 'center' }}>
        <div style={{ width: 90, height: 90, background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle size={48} color="white" />
        </div>
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 32, color: '#4ade80', marginBottom: 8 }}>Payment Successful!</h2>
        <p style={{ color: '#94a3b8', marginBottom: 8 }}>Your ticket is confirmed. Redirecting to My Bookings…</p>
        <p style={{ color: '#fbbf24', fontWeight: 700, fontSize: 20 }}>₹{totalAmount.toLocaleString('en-IN')} paid</p>
      </div>
    </div>
  );

  // Failed screen
  if (status === 'failed') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fade-up glass" style={{ borderRadius: 24, padding: 40, maxWidth: 400, textAlign: 'center' }}>
        <XCircle size={56} color="#ef4444" style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: '#f87171', marginBottom: 8 }}>Payment Failed</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>Your payment could not be processed. No amount was deducted.</p>
        <button className="btn-orange" onClick={() => setStatus('')} style={{ width: '100%', padding: 13 }}>Try Again</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* Payment Methods */}
        <div>
          <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: '#f1f5f9', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={22} color="#22c55e" /> Complete Payment
          </h2>

          {/* Method Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
            {[['UPI', <Smartphone size={14} />, '🇮🇳 UPI'], ['CARD', <CreditCard size={14} />, 'Card'], ['NETBANKING', <Building2 size={14} />, 'Net Banking'], ['WALLET', <Wallet size={14} />, 'Wallet']].map(([m, icon, label]) => (
              <button key={m} onClick={() => setMethod(m)}
                style={{
                  flex: 1, padding: '10px 6px', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: method === m ? 'linear-gradient(135deg,#FF9933,#ea580c)' : 'transparent',
                  color: method === m ? 'white' : '#64748b',
                  transition: 'all 0.2s',
                }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* UPI Panel */}
          {method === 'UPI' && (
            <div className="glass" style={{ borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: '#f1f5f9', marginBottom: 6 }}>UPI Payment</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>India's fastest payment method</p>

              {/* QR Code */}
              <div style={{ background: 'white', borderRadius: 16, padding: 20, width: 200, margin: '0 auto 24px', textAlign: 'center' }}>
                <div style={{ width: 160, height: 160, background: '#000', margin: '0 auto', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 2, padding: 8 }}>
                  {Array.from({ length: 100 }, (_, i) => (
                    <div key={i} style={{ background: [0,1,2,3,4,5,6,10,16,20,24,30,36,40,46,50,56,60,63,64,65,66,67,68,69,70,42,43,44,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,7,14,17,22,27,32,37,23,33,47,53,57,73,77].includes(i) ? '#000' : '#fff', borderRadius: 1 }} />
                  ))}
                </div>
                <p style={{ color: '#000', fontSize: 11, marginTop: 8, fontWeight: 600 }}>Scan to Pay</p>
                <p style={{ color: '#666', fontSize: 10 }}>irctc@upi</p>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 20, color: '#64748b', fontSize: 14 }}>— OR PAY WITH UPI APP —</div>

              {/* UPI Apps */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
                {UPI_APPS.map(app => (
                  <div key={app.name} onClick={() => { setSelectedApp(app.name); setUpiId(''); }}
                    style={{
                      textAlign: 'center', padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${selectedApp === app.name ? app.color : 'rgba(255,255,255,0.08)'}`,
                      background: selectedApp === app.name ? `${app.color}15` : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.2s',
                    }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{app.emoji}</div>
                    <div style={{ fontSize: 11, color: selectedApp === app.name ? '#f1f5f9' : '#64748b', fontWeight: 500 }}>{app.name}</div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginBottom: 16, color: '#475569', fontSize: 13 }}>— OR ENTER UPI ID —</div>
              <input className="input-field" placeholder="yourname@upi" value={upiId}
                onChange={e => { setUpiId(e.target.value); setSelectedApp(''); }} />
            </div>
          )}

          {/* Card Panel */}
          {method === 'CARD' && (
            <div className="glass" style={{ borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: '#f1f5f9', marginBottom: 20 }}>Credit / Debit Card</h3>
              <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden', minHeight: 120 }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,153,51,0.1)' }} />
                <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 24 }}>💳</div>
                <div style={{ fontFamily: 'Rajdhani', fontSize: 22, letterSpacing: 3, color: '#f1f5f9', marginBottom: 12 }}>
                  {card.number || '•••• •••• •••• ••••'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                  <span>{card.name || 'CARD HOLDER'}</span>
                  <span>{card.expiry || 'MM/YY'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="input-field" placeholder="Card Number" maxLength={19}
                  value={formatCard(card.number)} onChange={e => setCard(p => ({ ...p, number: e.target.value.replace(/\s/g, '') }))} />
                <input className="input-field" placeholder="Cardholder Name"
                  value={card.name} onChange={e => setCard(p => ({ ...p, name: e.target.value.toUpperCase() }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input className="input-field" placeholder="MM/YY" maxLength={5}
                    value={card.expiry} onChange={e => {
                      let v = e.target.value.replace(/\D/g,'');
                      if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2,4);
                      setCard(p => ({ ...p, expiry: v }));
                    }} />
                  <input className="input-field" placeholder="CVV" maxLength={3} type="password"
                    value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/,'').slice(0,3) }))} />
                </div>
              </div>
            </div>
          )}

          {/* Net Banking */}
          {method === 'NETBANKING' && (
            <div className="glass" style={{ borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: '#f1f5f9', marginBottom: 20 }}>Net Banking</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {BANKS.map(bank => (
                  <div key={bank} onClick={() => setSelectedBank(bank)}
                    style={{
                      padding: '13px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${selectedBank === bank ? '#FF9933' : 'rgba(255,255,255,0.07)'}`,
                      background: selectedBank === bank ? 'rgba(255,153,51,0.1)' : 'rgba(255,255,255,0.03)',
                      color: selectedBank === bank ? '#fbbf24' : '#94a3b8',
                      fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                    <Building2 size={16} />
                    {bank}
                    {selectedBank === bank && <span style={{ marginLeft: 'auto', color: '#22c55e' }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet */}
          {method === 'WALLET' && (
            <div className="glass" style={{ borderRadius: 16, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👛</div>
              <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: '#f1f5f9', marginBottom: 8 }}>Digital Wallet</h3>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>Mock wallet with ₹10,000 balance</p>
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 16 }}>
                <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 20 }}>Balance: ₹10,000</p>
              </div>
            </div>
          )}

          {error && <div style={{ marginTop: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>{error}</div>}
        </div>

        {/* Order Summary */}
        <div>
          <div className="glass" style={{ borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: '#f1f5f9', marginBottom: 16 }}>Order Summary</h3>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              <div style={{ marginBottom: 8 }}><strong style={{ color: '#f1f5f9' }}>{bookingData.trainName}</strong></div>
              <div style={{ marginBottom: 6 }}>Date: <span style={{ color: '#fbbf24' }}>{bookingData.date}</span></div>
              <div style={{ marginBottom: 6 }}>Class: <span style={{ color: '#a78bfa' }}>{bookingData.coachType}</span></div>
              <div style={{ marginBottom: 12 }}>Seats: <span style={{ color: '#60a5fa' }}>{bookingData.seats?.join(', ')}</span></div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Base fare</span><span>₹{bookingData.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span>GST (5%)</span><span>₹{Math.round((bookingData.totalAmount || 0) * 0.05).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                  <span style={{ color: '#f1f5f9' }}>Total</span>
                  <span style={{ color: '#fbbf24', fontFamily: 'Rajdhani', fontSize: 22 }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 12, color: '#4ade80', display: 'flex', gap: 8 }}>
            <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>100% secure payment. Your data is encrypted and never stored on our servers.</span>
          </div>

          <button className="btn-orange" style={{ width: '100%', padding: 15, fontSize: 16 }}
            onClick={initiatePayment} disabled={loading}>
            {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Initiating...</> : `Pay ₹${totalAmount.toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
