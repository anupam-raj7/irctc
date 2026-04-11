const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// ── POST /api/bookings/create ─────────────────────────────
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { train_id, journey_date, coach_type, seats, passenger_details, total_amount, payment_method, payment_id } = req.body;

    if (!train_id || !journey_date || !coach_type || !seats?.length || !passenger_details?.length)
      return res.status(400).json({ error: 'Missing required booking fields' });

    // Call the PostgreSQL transaction function
    const { data, error } = await supabase.rpc('book_ticket', {
      p_user_id: req.user.id,
      p_train_id: train_id,
      p_journey_date: journey_date,
      p_coach_type: coach_type,
      p_seats: seats,
      p_passenger_details: passenger_details,
      p_total_amount: total_amount,
      p_payment_method: payment_method || 'CARD',
      p_payment_id: payment_id || `PAY_${Date.now()}`,
    });

    if (error) throw error;

    const result = data?.[0];
    if (!result?.success) {
      return res.status(409).json({ error: result?.message || 'Booking failed - seat conflict' });
    }

    // Fetch full booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`*, trains(train_number, train_name, departure_time, arrival_time)`)
      .eq('id', result.booking_id)
      .single();

    res.status(201).json({
      message: 'Booking confirmed!',
      booking,
      pnr: result.pnr,
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking failed', message: err.message });
  }
});

// ── GET /api/bookings/my ──────────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id, pnr_number, journey_date, from_station, to_station,
        coach_type, seats_booked, passenger_details, total_amount,
        payment_status, booking_status, cancelled_at, refund_amount,
        created_at,
        trains (train_number, train_name, departure_time, arrival_time)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ bookings: bookings || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ── GET /api/bookings/pnr/:pnr ────────────────────────────
router.get('/pnr/:pnr', async (req, res) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`*, trains(train_number, train_name, departure_time, arrival_time, from_station, to_station)`)
      .eq('pnr_number', req.params.pnr)
      .single();

    if (error || !booking) return res.status(404).json({ error: 'PNR not found' });
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'PNR lookup failed' });
  }
});

// ── POST /api/bookings/:id/cancel ─────────────────────────
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Call the cancel transaction function
    const { data, error } = await supabase.rpc('cancel_ticket', {
      p_booking_id: id,
      p_user_id: req.user.id,
    });

    if (error) throw error;

    const result = data?.[0];
    if (!result?.success) {
      return res.status(400).json({ error: result?.message || 'Cancellation failed' });
    }

    res.json({
      message: result.message,
      refundAmount: result.refund_amount,
      refundNote: result.refund_amount > 0
        ? `Refund of ₹${result.refund_amount} will be credited in 5-7 business days`
        : 'No refund applicable (within 4 hours of journey)',
    });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Cancellation failed', message: err.message });
  }
});

module.exports = router;
