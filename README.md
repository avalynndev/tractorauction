# Tractor Auction Website

A comprehensive web application for auctioning used tractors, harvesters, and scrap tractors with mobile-responsive design.

## Features

- **Dual User System**: Separate interfaces for Sellers and Buyers
- **Membership Tiers**: 15-day free trial, then Silver/Gold/Diamond packages
- **Two Sale Types**: Auction bidding or Pre-approved direct sale
- **Real-time Bidding**: Live auction system with WebSocket support
- **Vehicle Management**: Comprehensive vehicle listing with all details
- **Mobile Responsive**: Optimized for all device sizes

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Authentication**: JWT with OTP verification

## API Documentation

Interactive API documentation is available at `/api-docs` when running the development server.

- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI Spec**: `http://localhost:3000/api/swagger.json`

See [docs/SWAGGER_SETUP.md](./docs/SWAGGER_SETUP.md) for details on adding documentation to API routes.

## Deployment

For production deployment to Vercel, see [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md).

The cron job for watchlist alerts will automatically activate when deployed to Vercel.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Set up database:
```bash
npx prisma generate
npx prisma db push
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes
│   └── page.tsx           # Homepage
├── components/            # Reusable components
├── lib/                   # Utilities and helpers
├── prisma/                # Database schema
└── public/                # Static assets
```

## Development Phases

See `DEVELOPMENT_PLAN.md` for detailed development roadmap.

## Contact

- Phone: 7801094747
- Email: contact@tractorauction.in
- Website: www.tractorauction.in















