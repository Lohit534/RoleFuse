# RoleFuse Enterprise Admin Portal

Dedicated administration and analytics console for the [RoleFuse](https://rolefuse.in) platform.

- **Production Deployment**: `https://rolefuseadmin.vercel.app`
- **User Application Target**: `https://rolefuse.in`
- **Authentication**: Supabase Auth (Admin Whitelist Guarded)

---

## Capabilities & Architecture

1. **Financial & Conversion Analytics**:
   - Live revenue calculations and paid tier breakdown (`totalRevenue`, `paidCount`).
   - SVG interactive Daily User Growth chart (14-day trailing timeline).
   - SVG Monthly Revenue Trends & volume chart (4-month comparison).
   - Conversion rate telemetry.

2. **User & Subscription Management**:
   - Searchable user directory across all registered candidates.
   - Dynamic plan tier modifications (`Free`, `Premium Pro`, `Pro Max`, `Owner`).
   - Token credit adjustment and real-time synchronization with Supabase.
   - Instant CSV User Data Export for offline auditing.

3. **Support Ticketing & Live Communication**:
   - Unified support mailbox with real-time ticket statuses (`pending`, `replied`).
   - In-app response dispatch back to user dashboard notification center.

4. **Broadcast Announcements**:
   - Push site-wide announcements, flash sales, and maintenance alerts.
   - Live synchronization with `rolefuse.in` banner alerts.

---

## Environment Variables

Configure the following in `.env.local` or within your Vercel Project Settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qasfeyddyolpdvmiogkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_EMAIL=[EMAIL_ADDRESS]
USER_APP_URL=https://rolefuse.in
```

---

## Local Development

```bash
# Run local dev server
npm run dev

# Run production build
npm run build
```
