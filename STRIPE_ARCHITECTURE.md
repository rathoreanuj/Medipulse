# Stripe Payment Integration - Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MEDIPULSE APPLICATION                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐        ┌──────────────────────┐        ┌─────────────┐
│                      │        │                      │        │             │
│   Frontend (React)   │◄──────►│  Backend (Node.js)   │◄──────►│   MongoDB   │
│   Port: 5173         │        │  Port: 4000          │        │   Database  │
│                      │        │                      │        │             │
└──────────┬───────────┘        └──────────┬───────────┘        └─────────────┘
           │                               │
           │ Stripe.js                     │ Stripe SDK
           │ (Client-side)                 │ (Server-side)
           │                               │
           └───────────┬───────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │                 │
              │  Stripe API     │
              │  (Payment       │
              │  Processing)    │
              │                 │
              └─────────────────┘
```

## Payment Flow Diagram

### Scenario 1: New Appointment with Online Payment

```
┌─────────┐          ┌──────────┐          ┌──────────┐          ┌─────────┐
│ Patient │          │ Frontend │          │ Backend  │          │ Stripe  │
└────┬────┘          └────┬─────┘          └────┬─────┘          └────┬────┘
     │                    │                     │                      │
     │ 1. Select Doctor   │                     │                      │
     │ & Time Slot        │                     │                      │
     ├───────────────────>│                     │                      │
     │                    │                     │                      │
     │ 2. Choose "Pay     │                     │                      │
     │    Online"         │                     │                      │
     ├───────────────────>│                     │                      │
     │                    │                     │                      │
     │ 3. Click "Book     │                     │                      │
     │    Appointment"    │                     │                      │
     ├───────────────────>│                     │                      │
     │                    │                     │                      │
     │                    │ 4. POST /api/payment│                      │
     │                    │    /create-payment  │                      │
     │                    │    -intent          │                      │
     │                    ├────────────────────>│                      │
     │                    │                     │                      │
     │                    │                     │ 5. Create Appointment│
     │                    │                     │    (payment: false) │
     │                    │                     ├─┐                    │
     │                    │                     │ │                    │
     │                    │                     │<┘                    │
     │                    │                     │                      │
     │                    │                     │ 6. Create Payment    │
     │                    │                     │    Intent            │
     │                    │                     ├─────────────────────>│
     │                    │                     │                      │
     │                    │                     │ 7. Return Client     │
     │                    │                     │    Secret            │
     │                    │                     │<─────────────────────┤
     │                    │                     │                      │
     │                    │ 8. Client Secret    │                      │
     │                    │    & Appointment ID │                      │
     │                    │<────────────────────┤                      │
     │                    │                     │                      │
     │ 9. Show Stripe     │                     │                      │
     │    Payment Modal   │                     │                      │
     │<───────────────────┤                     │                      │
     │                    │                     │                      │
     │ 10. Enter Card     │                     │                      │
     │     Details        │                     │                      │
     ├───────────────────>│                     │                      │
     │                    │                     │                      │
     │                    │ 11. Confirm Payment │                      │
     │                    │     (Stripe.js)     │                      │
     │                    ├─────────────────────┼─────────────────────>│
     │                    │                     │                      │
     │                    │                     │ 12. Process Payment  │
     │                    │                     │                      │
     │                    │                     │                      ├─┐
     │                    │                     │                      │ │
     │                    │                     │                      │<┘
     │                    │                     │                      │
     │                    │ 13. Payment Success │                      │
     │                    │<────────────────────┼──────────────────────┤
     │                    │                     │                      │
     │                    │ 14. POST /api/payment                      │
     │                    │     /verify-payment │                      │
     │                    ├────────────────────>│                      │
     │                    │                     │                      │
     │                    │                     │ 15. Verify with      │
     │                    │                     │     Stripe           │
     │                    │                     ├─────────────────────>│
     │                    │                     │                      │
     │                    │                     │ 16. Confirmed        │
     │                    │                     │<─────────────────────┤
     │                    │                     │                      │
     │                    │                     │ 17. Update Appt      │
     │                    │                     │     (payment: true)  │
     │                    │                     ├─┐                    │
     │                    │                     │ │                    │
     │                    │                     │<┘                    │
     │                    │                     │                      │
     │                    │ 18. Success         │                      │
     │                    │<────────────────────┤                      │
     │                    │                     │                      │
     │ 19. Show Success   │                     │                      │
     │     Message        │                     │                      │
     │<───────────────────┤                     │                      │
     │                    │                     │                      │
     │ 20. Redirect to    │                     │                      │
     │     My Appointments│                     │                      │
     │<───────────────────┤                     │                      │
```

### Scenario 2: New Appointment with Offline Payment

```
┌─────────┐          ┌──────────┐          ┌──────────┐
│ Patient │          │ Frontend │          │ Backend  │
└────┬────┘          └────┬─────┘          └────┬─────┘
     │                    │                     │
     │ 1. Select Doctor   │                     │
     │ & Time Slot        │                     │
     ├───────────────────>│                     │
     │                    │                     │
     │ 2. Choose "Pay at  │                     │
     │    Clinic (Cash)"  │                     │
     ├───────────────────>│                     │
     │                    │                     │
     │ 3. Click "Book     │                     │
     │    Appointment"    │                     │
     ├───────────────────>│                     │
     │                    │                     │
     │                    │ 4. POST /api/user   │
     │                    │    /book-appointment│
     │                    ├────────────────────>│
     │                    │                     │
     │                    │                     │ 5. Create Appointment
     │                    │                     │    (payment: false)
     │                    │                     ├─┐
     │                    │                     │ │
     │                    │                     │<┘
     │                    │                     │
     │                    │ 6. Success          │
     │                    │<────────────────────┤
     │                    │                     │
     │ 7. Show Success    │                     │
     │    Message         │                     │
     │<───────────────────┤                     │
     │                    │                     │
     │ 8. Redirect to     │                     │
     │    My Appointments │                     │
     │<───────────────────┤                     │
```

### Scenario 3: Pay Later for Unpaid Appointment

```
┌─────────┐          ┌──────────┐          ┌──────────┐          ┌─────────┐
│ Patient │          │ Frontend │          │ Backend  │          │ Stripe  │
└────┬────┘          └────┬─────┘          └────┬─────┘          └────┬────┘
     │                    │                     │                      │
     │ 1. Go to "My       │                     │                      │
     │    Appointments"   │                     │                      │
     ├───────────────────>│                     │                      │
     │                    │                     │                      │
     │ 2. See "Pay Now"   │                     │                      │
     │    on Unpaid Appt  │                     │                      │
     │<───────────────────┤                     │                      │
     │                    │                     │                      │
     │ 3. Click "Pay Now" │                     │                      │
     ├───────────────────>│                     │                      │
     │                    │                     │                      │
     │                    │ 4. POST /api/payment│                      │
     │                    │    /pay-appointment │                      │
     │                    ├────────────────────>│                      │
     │                    │                     │                      │
     │                    │                     │ 5. Create Payment    │
     │                    │                     │    Intent            │
     │                    │                     ├─────────────────────>│
     │                    │                     │                      │
     │                    │                     │ 6. Client Secret     │
     │                    │                     │<─────────────────────┤
     │                    │                     │                      │
     │                    │ 7. Return Secret    │                      │
     │                    │<────────────────────┤                      │
     │                    │                     │                      │
     │ 8. Show Payment    │                     │                      │
     │    Modal           │                     │                      │
     │<───────────────────┤                     │                      │
     │                    │                     │                      │
     │ [Payment flow same as Scenario 1, steps 10-20]                  │
```

## Database Schema

### Appointment Model (Updated)

```javascript
{
  userId: String,           // Reference to User
  docId: String,            // Reference to Doctor
  slotDate: String,         // Format: "DD_MM_YYYY"
  slotTime: String,         // Format: "HH:MM AM/PM"
  userData: Object,         // User details snapshot
  docData: Object,          // Doctor details snapshot
  amount: Number,           // Appointment fee
  date: Number,             // Booking timestamp
  cancelled: Boolean,       // Is appointment cancelled?
  payment: Boolean,         // ⭐ NEW: Is payment completed?
  isCompleted: Boolean      // Is appointment completed by doctor?
}
```

## API Endpoints

### Payment Endpoints (NEW)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payment/create-payment-intent` | ✅ User | Create payment intent for new appointment |
| POST | `/api/payment/verify-payment` | ✅ User | Verify payment after Stripe checkout |
| POST | `/api/payment/pay-appointment` | ✅ User | Create payment intent for existing unpaid appointment |

### User Endpoints (UPDATED)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/user/book-appointment` | ✅ User | Book appointment (now supports paymentMode parameter) |

## Environment Variables

### Backend (.env)
```
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
```

### Frontend (.env)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
```

## Security Features

1. **PCI Compliance**: Card details never touch your servers (handled by Stripe.js)
2. **Server-side Verification**: Payment verification done on backend
3. **Idempotency**: Stripe prevents duplicate charges
4. **Secure Keys**: Secret keys never exposed to client
5. **HTTPS Required**: Stripe requires HTTPS in production

## Payment States

```
┌─────────────────┐
│   Appointment   │
│     Booked      │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
  ┌──────────┐   ┌──────────┐
  │ Offline  │   │  Online  │
  │ Payment  │   │ Payment  │
  └────┬─────┘   └────┬─────┘
       │              │
       │              ├────────────┐
       │              │            │
       │              ▼            ▼
       │         ┌─────────┐  ┌────────┐
       │         │  Paid   │  │ Unpaid │
       │         └────┬────┘  └───┬────┘
       │              │           │
       │              │           │ Pay Later
       │              │           │ (Pay Now button)
       │              │           │
       │              │           ▼
       │              │      ┌─────────┐
       │              │      │  Paid   │
       │              │      └────┬────┘
       │              │           │
       └──────────────┴───────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Appointment  │
              │   Completed   │
              │ (by Doctor)   │
              └───────────────┘
```

## Key Benefits

✅ **Flexible Payment Options** - Patients can choose online or offline payment
✅ **Pay Later Feature** - Book now, pay later before appointment
✅ **Secure Processing** - Industry-standard PCI compliance via Stripe
✅ **Real-time Verification** - Immediate payment confirmation
✅ **Automatic Slot Management** - Slots reserved/released automatically
✅ **Payment Tracking** - Clear payment status on all appointments
✅ **International Support** - Stripe supports 135+ currencies and 45+ countries

---

For implementation details, see `STRIPE_INTEGRATION_SUMMARY.md`
For setup instructions, see `STRIPE_SETUP_GUIDE.md`
