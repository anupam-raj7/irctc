
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS trains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  train_number VARCHAR(10) UNIQUE NOT NULL,
  train_name VARCHAR(100) NOT NULL,
  from_station VARCHAR(100) NOT NULL,
  to_station VARCHAR(100) NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  duration VARCHAR(20) NOT NULL,
  days_of_operation TEXT[] DEFAULT '{}',
  total_seats INTEGER NOT NULL DEFAULT 72,
  price_sleeper NUMERIC(8,2) NOT NULL,
  price_ac3 NUMERIC(8,2) NOT NULL,
  price_ac2 NUMERIC(8,2) NOT NULL,
  price_ac1 NUMERIC(8,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  train_id UUID REFERENCES trains(id) ON DELETE CASCADE,
  journey_date DATE NOT NULL,
  coach_type VARCHAR(10) NOT NULL CHECK (coach_type IN ('SL','3A','2A','1A')),
  seat_number VARCHAR(10) NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  booking_id UUID,
  UNIQUE(train_id, journey_date, coach_type, seat_number)
);


CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pnr_number VARCHAR(10) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  train_id UUID REFERENCES trains(id) ON DELETE SET NULL,
  journey_date DATE NOT NULL,
  from_station VARCHAR(100) NOT NULL,
  to_station VARCHAR(100) NOT NULL,
  coach_type VARCHAR(10) NOT NULL,
  seats_booked TEXT[] NOT NULL,
  passenger_details JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PAID','REFUNDED','FAILED')),
  payment_method VARCHAR(30),
  payment_id VARCHAR(100),
  booking_status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (booking_status IN ('CONFIRMED','CANCELLED','WAITING')),
  cancelled_at TIMESTAMPTZ,
  refund_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  method VARCHAR(30) NOT NULL CHECK (method IN ('UPI','CARD','NETBANKING','WALLET')),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
  transaction_ref VARCHAR(100),
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-
CREATE TABLE IF NOT EXISTS account_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID,
  email VARCHAR(150),
  phone VARCHAR(15),
  ip_address VARCHAR(45),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


INSERT INTO trains (train_number, train_name, from_station, to_station, departure_time, arrival_time, duration, days_of_operation, total_seats, price_sleeper, price_ac3, price_ac2, price_ac1) VALUES
('12301','Rajdhani Express','New Delhi','Howrah Junction','16:55','09:55','17h 00m','{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',500,765,2055,2955,4950),
('12302','Rajdhani Express','Howrah Junction','New Delhi','14:05','07:55','17h 50m','{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',500,765,2055,2955,4950),
('12259','Sealdah Duronto','New Delhi','Sealdah','13:00','05:15','16h 15m','{"Mon","Wed","Fri","Sun"}',450,1185,1785,2575,4250),
('12305','Howrah Rajdhani','New Delhi','Howrah Junction','17:00','10:05','17h 05m','{"Tue","Thu","Sat"}',450,785,2095,3005,4995),
('12273','Howrah Duronto','New Delhi','Howrah Junction','14:00','05:55','15h 55m','{"Mon","Wed","Sat"}',400,1155,1755,2550,4200),
('12381','Poorva Express','Howrah Junction','New Delhi','20:05','17:05','21h 00m','{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',600,435,1155,1695,2895),
('12303','Poorva Express','Howrah Junction','New Delhi','08:15','05:05','20h 50m','{"Mon","Wed","Fri","Sun"}',600,435,1155,1695,2895),
('13005','Amritsar Mail','Howrah Junction','Amritsar Junction','14:30','12:15','21h 45m','{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',700,320,985,1450,2550),
('12951','Mumbai Rajdhani','New Delhi','Mumbai Central','16:00','08:35','16h 35m','{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',400,820,2180,3115,5150),
('22691','Rajdhani Express','KSR Bengaluru','Hazrat Nizamuddin','20:00','05:55','33h 55m','{"Mon","Thu","Sun"}',350,1005,2705,3870,6390);



CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate PNR
CREATE OR REPLACE FUNCTION generate_pnr() RETURNS VARCHAR AS $$
DECLARE
  pnr VARCHAR(10);
  exists_check BOOLEAN;
BEGIN
  LOOP
    pnr := LPAD(FLOOR(RANDOM() * 9000000000 + 1000000000)::TEXT, 10, '0');
    SELECT EXISTS(SELECT 1 FROM bookings WHERE pnr_number = pnr) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN pnr;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- BOOK TICKET (Transaction with rollback support)
-- ============================================================
CREATE OR REPLACE FUNCTION book_ticket(
  p_user_id UUID,
  p_train_id UUID,
  p_journey_date DATE,
  p_coach_type VARCHAR,
  p_seats TEXT[],
  p_passenger_details JSONB,
  p_total_amount NUMERIC,
  p_payment_method VARCHAR,
  p_payment_id VARCHAR
) RETURNS TABLE(success BOOLEAN, booking_id UUID, pnr VARCHAR, message TEXT) AS $$
DECLARE
  v_booking_id UUID;
  v_pnr VARCHAR(10);
  v_seat TEXT;
  v_already_booked BOOLEAN;
  v_train_info RECORD;
BEGIN
  -- Fetch train
  SELECT from_station, to_station INTO v_train_info FROM trains WHERE id = p_train_id;

  -- Check all seats available (lock rows)
  FOREACH v_seat IN ARRAY p_seats LOOP
    SELECT is_booked INTO v_already_booked
    FROM seats
    WHERE train_id = p_train_id
      AND journey_date = p_journey_date
      AND coach_type = p_coach_type
      AND seat_number = v_seat
    FOR UPDATE;

    IF v_already_booked IS NULL THEN
      -- Seat row doesn't exist yet, insert it
      INSERT INTO seats (train_id, journey_date, coach_type, seat_number, is_booked)
      VALUES (p_train_id, p_journey_date, p_coach_type, v_seat, FALSE);
    ELSIF v_already_booked THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, 'Seat ' || v_seat || ' is already booked';
      RETURN;
    END IF;
  END LOOP;

  -- Generate PNR
  v_pnr := generate_pnr();
  v_booking_id := uuid_generate_v4();

  -- Insert booking
  INSERT INTO bookings (id, pnr_number, user_id, train_id, journey_date, from_station, to_station,
    coach_type, seats_booked, passenger_details, total_amount, payment_status, payment_method,
    payment_id, booking_status)
  VALUES (v_booking_id, v_pnr, p_user_id, p_train_id, p_journey_date,
    v_train_info.from_station, v_train_info.to_station,
    p_coach_type, p_seats, p_passenger_details, p_total_amount,
    'PAID', p_payment_method, p_payment_id, 'CONFIRMED');

  -- Mark seats as booked
  FOREACH v_seat IN ARRAY p_seats LOOP
    UPDATE seats SET is_booked = TRUE, booking_id = v_booking_id
    WHERE train_id = p_train_id AND journey_date = p_journey_date
      AND coach_type = p_coach_type AND seat_number = v_seat;
  END LOOP;

  -- Insert payment record
  INSERT INTO payments (booking_id, user_id, amount, method, status, transaction_ref)
  VALUES (v_booking_id, p_user_id, p_total_amount, p_payment_method, 'SUCCESS', p_payment_id);

  RETURN QUERY SELECT TRUE, v_booking_id, v_pnr, 'Booking confirmed successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CANCEL TICKET (Transaction with refund)
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_ticket(
  p_booking_id UUID,
  p_user_id UUID
) RETURNS TABLE(success BOOLEAN, refund_amount NUMERIC, message TEXT) AS $$
DECLARE
  v_booking RECORD;
  v_seat TEXT;
  v_refund NUMERIC;
  v_hours_left NUMERIC;
BEGIN
  -- Fetch and lock booking
  SELECT * INTO v_booking FROM bookings
  WHERE id = p_booking_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_booking IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 'Booking not found';
    RETURN;
  END IF;

  IF v_booking.booking_status = 'CANCELLED' THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 'Ticket already cancelled';
    RETURN;
  END IF;

  -- Calculate refund based on hours before journey
  v_hours_left := EXTRACT(EPOCH FROM (v_booking.journey_date::TIMESTAMPTZ - NOW())) / 3600;

  IF v_hours_left > 48 THEN
    v_refund := v_booking.total_amount * 0.90; -- 90% refund
  ELSIF v_hours_left > 24 THEN
    v_refund := v_booking.total_amount * 0.75; -- 75% refund
  ELSIF v_hours_left > 4 THEN
    v_refund := v_booking.total_amount * 0.50; -- 50% refund
  ELSE
    v_refund := 0; -- No refund within 4 hours
  END IF;

  -- Update booking status
  UPDATE bookings SET
    booking_status = 'CANCELLED',
    payment_status = CASE WHEN v_refund > 0 THEN 'REFUNDED' ELSE payment_status END,
    refund_amount = v_refund,
    cancelled_at = NOW()
  WHERE id = p_booking_id;

  -- Free up seats
  FOREACH v_seat IN ARRAY v_booking.seats_booked LOOP
    UPDATE seats SET is_booked = FALSE, booking_id = NULL
    WHERE train_id = v_booking.train_id
      AND journey_date = v_booking.journey_date
      AND coach_type = v_booking.coach_type
      AND seat_number = v_seat;
  END LOOP;

  -- Update payment record
  UPDATE payments SET status = 'REFUNDED' WHERE booking_id = p_booking_id;

  RETURN QUERY SELECT TRUE, v_refund, 'Ticket cancelled. Refund: ₹' || v_refund::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE trains ENABLE ROW LEVEL SECURITY;

-- Allow backend service role full access (used by Express backend)
CREATE POLICY "Service role full access - users" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - bookings" ON bookings FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - payments" ON payments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - seats" ON seats FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - trains" ON trains FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - logs" ON account_logs FOR ALL TO service_role USING (true);

-- Public can read trains
CREATE POLICY "Public read trains" ON trains FOR SELECT TO anon USING (is_active = true);

COMMIT;
