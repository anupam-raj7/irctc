const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// ── GET /api/trains/search ────────────────────────────────
// Query: from, to, date, class (optional)
router.get('/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    if (!from || !to || !date)
      return res.status(400).json({ error: 'from, to, and date are required' });

    const journeyDate = new Date(date);
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dayName = dayNames[journeyDate.getDay()];

    const { data: trains, error } = await supabase
      .from('trains')
      .select('*')
      .ilike('from_station', `%${from}%`)
      .ilike('to_station', `%${to}%`)
      .eq('is_active', true)
      .contains('days_of_operation', [dayName]);

    if (error) throw error;

    // For each train, count available seats per class
    const trainsWithAvailability = await Promise.all(
      (trains || []).map(async (train) => {
        const classes = ['SL', '3A', '2A', '1A'];
        const availability = {};

        for (const cls of classes) {
          const { count: bookedCount } = await supabase
            .from('seats')
            .select('*', { count: 'exact', head: true })
            .eq('train_id', train.id)
            .eq('journey_date', date)
            .eq('coach_type', cls)
            .eq('is_booked', true);

          const totalSeats = cls === 'SL' ? 72 : cls === '3A' ? 64 : cls === '2A' ? 46 : 24;
          availability[cls] = {
            total: totalSeats,
            available: totalSeats - (bookedCount || 0),
            price: train[`price_${cls.toLowerCase().replace('a', 'a')}`] ||
                   (cls === 'SL' ? train.price_sleeper :
                    cls === '3A' ? train.price_ac3 :
                    cls === '2A' ? train.price_ac2 : train.price_ac1),
          };
        }

        return { ...train, availability };
      })
    );

    res.json({ trains: trainsWithAvailability, searchDate: date, day: dayName });
  } catch (err) {
    console.error('Train search error:', err);
    res.status(500).json({ error: 'Failed to search trains', message: err.message });
  }
});

// ── GET /api/trains/:trainId/seats ────────────────────────
router.get('/:trainId/seats', async (req, res) => {
  try {
    const { trainId } = req.params;
    const { date, coach_type } = req.query;

    if (!date || !coach_type)
      return res.status(400).json({ error: 'date and coach_type required' });

    // Define seat layout
    const seatLayouts = {
      SL: { coaches: ['S1','S2','S3','S4'], seatsPerCoach: 72 },
      '3A': { coaches: ['B1','B2','B3','B4'], seatsPerCoach: 64 },
      '2A': { coaches: ['A1','A2'], seatsPerCoach: 46 },
      '1A': { coaches: ['H1'], seatsPerCoach: 24 },
    };

    const layout = seatLayouts[coach_type];
    if (!layout) return res.status(400).json({ error: 'Invalid coach type' });

    // Get all booked seats for this train/date/class
    const { data: bookedSeats } = await supabase
      .from('seats')
      .select('seat_number')
      .eq('train_id', trainId)
      .eq('journey_date', date)
      .eq('coach_type', coach_type)
      .eq('is_booked', true);

    const bookedSet = new Set((bookedSeats || []).map(s => s.seat_number));

    // Build seat map
    const seatMap = {};
    layout.coaches.forEach(coach => {
      seatMap[coach] = [];
      for (let i = 1; i <= layout.seatsPerCoach; i++) {
        const seatId = `${coach}-${i}`;
        seatMap[coach].push({
          seatNumber: seatId,
          isBooked: bookedSet.has(seatId),
          berth: i % 8 === 1 ? 'LB' : i % 8 === 2 ? 'MB' : i % 8 === 3 ? 'UB' : i % 8 === 4 ? 'LB' : i % 8 === 5 ? 'MB' : i % 8 === 6 ? 'UB' : i % 8 === 7 ? 'SL' : 'SU',
        });
      }
    });

    res.json({ trainId, date, coach_type, seatMap, bookedCount: bookedSet.size });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seats', message: err.message });
  }
});

// ── GET /api/trains/stations ──────────────────────────────
router.get('/stations/list', async (req, res) => {
  const stations = [
    'New Delhi','Howrah Junction','Sealdah','Mumbai Central','Mumbai CST',
    'Chennai Central','Bengaluru City','Hazrat Nizamuddin','Amritsar Junction',
    'Ahmedabad','Hyderabad','Pune','Kolkata','Patna Junction','Lucknow',
    'Varanasi','Agra Cantt','Jaipur','Chandigarh','Bhopal Junction',
    'Nagpur','Guwahati','Thiruvananthapuram','Kochi','Coimbatore',
    'Visakhapatnam','Vijayawada','Bhubaneswar','Raipur','Surat',
  ];
  res.json({ stations });
});

module.exports = router;
