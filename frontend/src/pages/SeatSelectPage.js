import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Train, ArrowRight } from 'lucide-react';
import api from '../utils/api';

const SeatSelectPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const trainId = params.get('trainId');
  const date = params.get('date');
  const coachType = params.get('class') || 'SL';
  const trainName = params.get('trainName');
  const trainNo = params.get('trainNo');

  const [seatMap, setSeatMap] = useState({});
  const [selectedCoach, setSelectedCoach] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState([{ name: '', age: '', gender: 'M' }]);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState(0);

  useEffect(() => { fetchSeats(); }, []);

  const fetchSeats = async () => {
    try {
      const res = await api.get(`/trains/${trainId}/seats?date=${date}&coach_type=${coachType}`);
      setSeatMap(res.data.seatMap);
      const firstCoach = Object.keys(res.data.seatMap)[0];
      setSelectedCoach(firstCoach);

      // Get price from search
      const trainRes = await api.get(`/trains/search?from=X&to=X&date=${date}`).catch(() => null);
    } catch { } finally { setLoading(false); }

    // Mock price based on class
    const prices = { SL: 650, '3A': 1450, '2A': 2100, '1A': 3800 };
    setPrice(prices[coachType] || 650);
  };

  const toggleSeat = (seatNum, isBooked) => {
    if (isBooked) return;
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(s => s.filter(x => x !== seatNum));
      setPassengers(p => p.slice(0, -1));
    } else if (selectedSeats.length < 6) {
      setSelectedSeats(s => [...s, seatNum]);
      setPassengers(p => [...p, { name: '', age: '', gender: 'M' }]);
    }
  };

  const updatePassenger = (i, field, val) => {
    setPassengers(p => p.map((x, idx) => idx === i ? { ...x, [field]: val } : x));
  };

  const canProceed = selectedSeats.length > 0 && passengers.slice(0, selectedSeats.length).every(p => p.name && p.age);

  const handleProceed = () => {
    const bookingData = { trainId, date, coachType, seats: selectedSeats, passengers: passengers.slice(0, selectedSeats.length), totalAmount: price * selectedSeats.length, trainName, trainNo };
    navigate('/payment', { state: { bookingData } });
  };

  const seats = seatMap[selectedCoach] || [];

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div className="glass" style={{ borderRadius: 16, padding: '18px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Train size={20} color="#FF9933" />
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: '#f1f5f9' }}>{trainName}</span>
          <span style={{ color: '#64748b', fontSize: 13 }}>#{trainNo}</span>
          <ArrowRight size={14} color="#475569" style={{ marginLeft: 'auto' }} />
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{coachType} Class</span>
          <span style={{ color: '#64748b', fontSize: 13 }}>{date}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Seat Map */}
          <div>
            {/* Coach Selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {Object.keys(seatMap).map(coach => (
                <button key={coach} onClick={() => setSelectedCoach(coach)}
                  style={{
                    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', border: '1.5px solid',
                    borderColor: selectedCoach === coach ? '#FF9933' : 'rgba(255,255,255,0.1)',
                    background: selectedCoach === coach ? 'rgba(255,153,51,0.15)' : 'rgba(255,255,255,0.03)',
                    color: selectedCoach === coach ? '#FF9933' : '#64748b',
                    transition: 'all 0.2s',
                  }}>
                  {coach}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12 }}>
              {[['seat-available', 'Available'], ['seat-selected', 'Selected'], ['seat-booked', 'Booked']].map(([cls, label]) => (
                <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className={cls} style={{ width: 22, height: 22 }} />
                  <span style={{ color: '#94a3b8' }}>{label}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} /></div>
            ) : (
              <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                  {seats.map((seat) => (
                    <div key={seat.seatNumber}
                      className={seat.isBooked ? 'seat-booked' : selectedSeats.includes(seat.seatNumber) ? 'seat-selected' : 'seat-available'}
                      style={{ height: 38 }}
                      onClick={() => toggleSeat(seat.seatNumber, seat.isBooked)}
                      title={seat.seatNumber}>
                      <span style={{ fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                        {seat.seatNumber.split('-')[1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Panel */}
          <div>
            <div className="glass" style={{ borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: '#f1f5f9', marginBottom: 16 }}>
                Selected Seats ({selectedSeats.length})
              </h3>
              {selectedSeats.length === 0 ? (
                <p style={{ color: '#475569', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Click seats to select (max 6)</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {selectedSeats.map(s => (
                    <span key={s} style={{ background: 'rgba(255,153,51,0.2)', border: '1px solid rgba(255,153,51,0.4)', borderRadius: 6, padding: '3px 9px', fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              )}

              {/* Passenger Details */}
              {selectedSeats.map((seat, i) => (
                <div key={seat} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < selectedSeats.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>Passenger {i + 1} — {seat}</div>
                  <input className="input-field" style={{ marginBottom: 6, padding: '9px 12px', fontSize: 13 }}
                    placeholder="Full Name" value={passengers[i]?.name || ''}
                    onChange={e => updatePassenger(i, 'name', e.target.value)} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <input className="input-field" style={{ padding: '9px 12px', fontSize: 13 }}
                      placeholder="Age" type="number" min={1} max={120}
                      value={passengers[i]?.age || ''} onChange={e => updatePassenger(i, 'age', e.target.value)} />
                    <select className="input-field" style={{ padding: '9px 12px', fontSize: 13, appearance: 'none' }}
                      value={passengers[i]?.gender || 'M'} onChange={e => updatePassenger(i, 'gender', e.target.value)}>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="T">Other</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Fare Summary */}
            {selectedSeats.length > 0 && (
              <div className="glass" style={{ borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'Rajdhani', fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>Fare Summary</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
                  <span>Base Fare × {selectedSeats.length}</span>
                  <span>₹{(price * selectedSeats.length).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>
                  <span>Service Tax (5%)</span>
                  <span>₹{Math.round(price * selectedSeats.length * 0.05).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#f1f5f9' }}>Total</span>
                  <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, color: '#fbbf24' }}>
                    ₹{Math.round(price * selectedSeats.length * 1.05).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <button className="btn-orange" style={{ width: '100%', padding: 14, fontSize: 15 }}
              onClick={handleProceed} disabled={!canProceed}>
              Proceed to Payment →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectPage;
