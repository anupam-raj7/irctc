const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const router = express.Router();
const supabase = require('../supabase');

// ── Email transporter ─────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"IRCTC Rail Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your IRCTC OTP for Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f0f1a; color: #f1f5f9; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #FF9933; margin: 0; font-size: 28px;">🚂 IRCTC Rail Connect</h1>
        </div>
        <h2 style="color: #f1f5f9;">Hello, ${name}!</h2>
        <p style="color: #94a3b8;">Your One-Time Password (OTP) for account verification:</p>
        <div style="background: #1e293b; border: 2px solid #FF9933; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #FF9933;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">This OTP is valid for <strong style="color: #f1f5f9;">10 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        <div style="border-top: 1px solid #334155; margin-top: 24px; padding-top: 16px; text-align: center;">
          <p style="color: #475569; font-size: 12px;">IRCTC Rail Connect — Book Smarter, Travel Better</p>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

// ── Log to account_logs table ─────────────────────────────
const logEvent = async (event_type, user_id, email, phone, details, ip) => {
  await supabase.from('account_logs').insert({
    event_type, user_id: user_id || null, email, phone, details,
    ip_address: ip || 'unknown',
  });
};

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password)
      return res.status(400).json({ error: 'All fields are required' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    // Check duplicate
    const { data: existingEmail } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

    const { data: existingPhone } = await supabase
      .from('users').select('id').eq('phone', phone).single();
    if (existingPhone) return res.status(409).json({ error: 'Phone number already registered' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ name, email, phone, password_hash: hashedPassword, otp_code: otp, otp_expires_at: otpExpiry.toISOString(), is_verified: false })
      .select('id, name, email, phone')
      .single();

    if (error) throw error;

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, name);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      // Still succeed but warn
    }

    await logEvent('REGISTER', newUser.id, email, phone, `New registration: ${name}`, req.ip);

    res.status(201).json({
      message: 'Account created! Check your email for OTP.',
      userId: newUser.id,
      email,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, otp_code, otp_expires_at, is_verified')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    if (user.is_verified) return res.status(400).json({ error: 'Account already verified' });

    if (new Date() > new Date(user.otp_expires_at))
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });

    if (user.otp_code !== otp)
      return res.status(400).json({ error: 'Invalid OTP' });

    await supabase.from('users')
      .update({ is_verified: true, otp_code: null, otp_expires_at: null })
      .eq('id', user.id);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    await logEvent('VERIFY_OTP', user.id, email, null, 'Account verified successfully', req.ip);

    res.json({ message: 'Account verified!', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed', message: err.message });
  }
});

// ── POST /api/auth/resend-otp ─────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.is_verified) return res.status(400).json({ error: 'Account already verified' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await supabase.from('users')
      .update({ otp_code: otp, otp_expires_at: otpExpiry.toISOString() })
      .eq('id', user.id);

    await sendOTPEmail(email, otp, user.name);
    res.json({ message: 'New OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      await logEvent('LOGIN_FAILED', user.id, email, null, 'Wrong password', req.ip);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_verified)
      return res.status(403).json({ error: 'Please verify your email first', needsVerification: true, email });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await logEvent('LOGIN', user.id, email, null, 'Successful login', req.ip);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ── GET /api/auth/download-logs ───────────────────────────
router.get('/download-logs', authMiddleware, async (req, res) => {
  try {
    const { data: logs } = await supabase
      .from('account_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, phone, is_verified, created_at');

    let txt = '=======================================================\n';
    txt += '       IRCTC Rail Connect — Registered Accounts\n';
    txt += `       Generated: ${new Date().toISOString()}\n`;
    txt += '=======================================================\n\n';

    txt += '--- USERS ---\n';
    (users || []).forEach((u, i) => {
      txt += `[${i + 1}] Name: ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Verified: ${u.is_verified} | Joined: ${u.created_at}\n`;
    });

    txt += '\n--- ACTIVITY LOGS ---\n';
    (logs || []).forEach((l) => {
      txt += `[${l.created_at}] ${l.event_type} | Email: ${l.email || '-'} | IP: ${l.ip_address || '-'} | ${l.details || ''}\n`;
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="irctc_accounts.txt"');
    res.send(txt);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate log file' });
  }
});

module.exports = router;
