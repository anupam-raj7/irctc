const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ── POST /api/payments/initiate ───────────────────────────
// Creates a payment session (mock Razorpay-style)
router.post('/initiate', authMiddleware, async (req, res) => {
  try {
    const { amount, booking_data } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required' });

    // Mock payment order
    const orderId = `ORDER_${uuidv4().replace(/-/g, '').slice(0,16).toUpperCase()}`;
    const paymentKey = `rzp_test_mock_${Date.now()}`;

    res.json({
      orderId,
      amount,
      currency: 'INR',
      key: paymentKey,
      name: 'IRCTC Rail Connect',
      description: 'Train Ticket Booking',
      prefill: { name: req.user.name, email: req.user.email },
    });
  } catch (err) {
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

// ── POST /api/payments/verify ─────────────────────────────
// Simulates payment verification & creates booking
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { order_id, payment_method, card_last4, upi_id, booking_data } = req.body;

    // Simulate payment success (90% success rate for demo)
    const isSuccess = Math.random() > 0.05; // 95% success

    if (!isSuccess) {
      return res.status(402).json({
        error: 'Payment failed',
        code: 'PAYMENT_DECLINED',
        message: 'Your payment was declined. Please try again or use a different payment method.',
      });
    }

    const transactionRef = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;

    res.json({
      success: true,
      transactionRef,
      paymentId: order_id,
      method: payment_method,
      message: 'Payment successful',
    });
  } catch (err) {
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

module.exports = router;
