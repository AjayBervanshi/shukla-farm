
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('Wedding','Reception','Birthday','Engagement','Corporate','Puja','Other')),
  event_date DATE NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('Slot 1','Slot 2','Slot 3')),
  guests INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Confirmed','Pending','Cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_mode IN ('Cash','UPI','Bank Transfer','Cheque','Other')),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('Wedding','Reception','Birthday','Engagement','Corporate','Puja','Other')),
  estimated_date DATE,
  guests INTEGER DEFAULT 0,
  budget NUMERIC(12,2) DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'New Inquiry' CHECK (stage IN ('New Inquiry','Contacted','Site Visit','Negotiation','Won','Lost')),
  source TEXT NOT NULL DEFAULT 'WhatsApp' CHECK (source IN ('WhatsApp','Instagram','Facebook','Google','Referral','Walk-in','Phone Call','Other')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.leads FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX bookings_date_slot_idx ON public.bookings(event_date, slot);
CREATE INDEX payments_booking_idx ON public.payments(booking_id);
CREATE INDEX leads_stage_idx ON public.leads(stage);
