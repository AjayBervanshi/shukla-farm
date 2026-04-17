

# Shukla Farms — Banquet & Event Venue Management

A public, full-stack venue management dashboard with luxury dark+gold styling. No auth — anyone with the URL can use it.

## Backend (Lovable Cloud)

Three tables with public RLS policies (full read/write):
- **bookings** — client, event, date, slot, amounts, status
- **payments** — linked to bookings, amount, mode, date
- **leads** — pipeline stage, source, budget

Slot conflict check runs server-side via query before any insert/update.

## Design System

- **Palette:** deep navy `#1A1A2E` bg, gold `#C9A84C` accents, warm off-white text, status colors (green/orange/red)
- **Fonts:** Cormorant Garamond (display), DM Sans (body), DM Mono (numbers)
- **Feel:** dark velvet surfaces, gold-bordered cards with subtle shimmer, blurred modal backdrops, pill status badges
- All currency in `en-IN` format → `₹1,25,000`
- All dates → `15 Jan 2025`

## Layout

- **Sidebar (240px, fixed left):** Shukla Farms logo (gold serif), "Nagpur's Premier Venue" subtitle, nav items (Dashboard, Bookings, Leads, Payments) with Lucide icons, today's date pinned at bottom
- **Mobile:** sidebar collapses to hamburger top bar
- Routes: `/` (Dashboard), `/bookings`, `/leads`, `/payments`

## Pages

### 1. Dashboard (`/`)
- **Today's 3 slots strip:** each shows time range + booked client (green) or "Available" (muted); click to open booking
- **4 stat cards:** Today's Slots summary, Month Revenue, Pending Dues, Open Leads
- **Recent Bookings table** (last 5)
- **Monthly Revenue bar chart** (Recharts, last 6 months, gold bars)
- **Upcoming this week** list

### 2. Bookings (`/bookings`)
- Search (name/phone), filters (status, event type, month), **+ New Booking** (gold), **Export CSV** (outline)
- Table: client+phone, event badge, date+slot pill, guests, total/advance/due stacked, payment progress bar, status badge, edit/delete/receipt actions
- **Add/Edit modal:** all fields per spec; slot conflict check before save shows warning modal with conflicting client name
- **Receipt:** styled print layout via `window.print()` (header, client/event details, payment summary, thank-you footer)
- **CSV export:** `shukla-farms-bookings-YYYY-MM.csv`

### 3. Leads (`/leads`)
- **Toggle:** Kanban (default) / Table view
- **Kanban:** 6 columns (New Inquiry → Contacted → Site Visit → Negotiation → Won / Lost), drag-and-drop via @dnd-kit, stage updates persist immediately
- **Lead cards:** name, phone with WhatsApp link (`wa.me/91...` with prefilled message), event badge, est. date, guests, budget, source pill, edit/delete
- **Won leads:** "Convert to Booking" button pre-fills booking modal
- **Table view:** sortable columns, stage filter
- Add/Edit modal with all fields

### 4. Payments (`/payments`)
- **3 summary cards:** Total Collected, Total Pending Dues, Fully Paid Bookings count
- **Per-booking tracker table:** client+date, event, total, paid (sum), balance (red/green), progress bar, status pill, **+ Pay** button
- **+ Pay modal:** booking summary, payment history list, form (amount capped at remaining balance, date, mode, note); on save inserts payment record AND increments `advance_paid` on booking

## Reusable UI

- Status, event type, slot, source badges (pill-shaped, color-coded)
- Payment progress bar (green/orange/red by completion)
- Modal wrapper (focus trap, Esc to close, blurred backdrop)
- Loading skeletons (animated pulse, card-shaped — not spinners)
- Empty states (icon + message + CTA)

## Behavior & Polish

- **TanStack Query** for all data fetching with cache invalidation after mutations
- **Optimistic updates** on Kanban drag, payment add
- **Sonner toasts:** success (gold/green), error (red), conflict (orange with details)
- **Slot conflict modal:** blocks save, shows conflicting booking
- **Mobile:** horizontal scroll for tables/kanban, full-screen modals, 44px+ tap targets
- **Slot 3 label:** explicitly displays "6:30 PM – 7:15 AM (next day)"

