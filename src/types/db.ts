export type Booking = {
  id: string;
  client_name: string;
  phone: string;
  event_type: string;
  event_date: string;
  slot: string;
  guests: number;
  total_amount: number;
  advance_paid: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  note: string;
  created_at: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  event_type: string;
  estimated_date: string | null;
  guests: number;
  budget: number;
  stage: string;
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
};
