# Flawlez Deployment Guide

## Frontend

Deploy the Vite app to Vercel or any static host.

Required frontend env vars:

- `VITE_API_URL`
- `VITE_MSG91_WIDGET_ID`
- `VITE_MSG91_TOKEN_AUTH`

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

## Backend

Deploy the Express + Prisma server to a Node host such as Render, Railway, Fly.io, or your VPS.

Required backend env vars:

- `PORT`
- `DATABASE_URL`
- `ACCESS_TOKEN_SECRET`
- `MSG91_AUTH_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `CORS_ORIGINS`
- `ADMIN_USERNAMES`

Install and generate Prisma client:

```bash
npm install
npm run build
```

Start command:

```bash
npm start
```

## Razorpay setup

1. Add live `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
2. Configure a webhook in Razorpay pointing to:

```text
https://your-backend-domain.com/api/payments/webhook
```

3. Use the same webhook secret in `RAZORPAY_WEBHOOK_SECRET`.
4. Enable payment events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`

## Database notes

- The server boot process runs startup SQL to add missing columns/tables for the current schema.
- For clean production environments, keep Prisma schema and database synced before launch.

## Launch checklist

1. Set all frontend and backend env vars.
2. Add your admin username to `ADMIN_USERNAMES`.
3. Verify signup/login with MSG91.
4. Test a real Razorpay payment in live mode.
5. Test coupon creation and checkout application.
6. Test admin product, stock, order, and user management.
7. Confirm CORS only allows your live frontend origin.
