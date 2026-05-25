# Arada Mart - Used Electronics Marketplace (Ethiopia)

A complete, production-ready web application for buying and selling used electronics in Ethiopia. Built with React, Supabase, and modern web technologies.

## Features

- **User Authentication**: Email/password signup and login with Supabase Auth
- **Listing Management**: Create, edit, delete, and renew listings with image uploads
- **Browsing & Search**: Full-text search with filters for category, price, condition, location
- **In-App Chat**: Real-time messaging between buyers and sellers
- **User Profiles**: Manage listings, view credits, edit profile information
- **Admin Panel**: Manage user credits, view reports, moderate content
- **Email Notifications**: Welcome emails, new message alerts, expiration warnings
- **PWA Support**: Installable as a mobile app with offline capabilities
- **Listing Credits System**: 1 free listing per user, additional listings require credits
- **Listing Expiration**: 30-day auto-expiration with renewal option

## Tech Stack

- **Frontend**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Email**: Resend
- **Maps**: OpenStreetMap + Leaflet (free, no API key required)
- **PWA**: Vite PWA plugin
- **State Management**: React Context
- **Testing**: Vitest + React Testing Library

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- A Resend account (free tier works)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd used_item_marketplace
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose a name (e.g., "arada-mart")
4. Choose a database password (save it securely)
5. Choose a region closest to Ethiopia (e.g., South Africa)
6. Click "Create new project"

#### Get Your Supabase Credentials

1. Go to Project Settings → API
2. Copy your Project URL and anon/public API key
3. Keep these handy for the next step

#### Run the Database Migration

1. Go to the SQL Editor in your Supabase dashboard
2. Click "New Query"
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

This will create all necessary tables, indexes, RLS policies, and triggers.

#### Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Click "New Bucket"
3. Name it `listing-images`
4. Make it Public (for simplicity in MVP)
5. Configure bucket policies to allow authenticated users to upload

#### Enable Realtime

1. Go to Database → Replication
2. Enable replication for `conversations` and `messages` tables
3. This enables real-time chat functionality

#### Set Up an Admin User

After creating your first user account, you need to set them as admin:

1. Go to the SQL Editor in Supabase
2. Run this query (replace with your user's email):

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 4. Set Up Resend

#### Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email domain (or use the default resend.dev domain for testing)
3. Go to API Keys and create a new API key
4. Copy the API key

#### Configure Email Templates

The email templates are already configured in `src/lib/resend.js`. You can customize them as needed.

### 5. Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RESEND_API_KEY=your_resend_api_key
VITE_APP_NAME="Arada Mart"
```

### 6. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 7. Deploy the Edge Function (Optional)

The expiration warning email is implemented as a Supabase Edge Function:

1. Install the Supabase CLI:

```bash
npm install -g supabase
```

2. Link your project:

```bash
supabase link --project-ref your-project-ref
```

3. Deploy the function:

```bash
supabase functions deploy send-expiration-warning
```

4. Set up environment variables for the function:

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. Create a cron job in Supabase to run the function daily (via pg_cron or GitHub Actions)

## Running Tests

```bash
npm test
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and import your repository
3. Add environment variables in Netlify dashboard
4. Deploy

## Project Structure

```
used_item_marketplace/
├── public/                 # Static assets and PWA icons
├── src/
│   ├── components/         # Reusable components
│   │   ├── Layout.jsx
│   │   ├── ListingCard.jsx
│   │   ├── SearchFilters.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── MapPicker.jsx
│   ├── context/           # React Context providers
│   │   └── AuthContext.jsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useListings.js
│   │   ├── useChat.js
│   │   └── useListings.test.js
│   ├── lib/               # Utility functions and API clients
│   │   ├── supabase.js
│   │   ├── resend.js
│   │   ├── utils.js
│   │   └── utils.test.js
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── CreateListing.jsx
│   │   ├── ListingDetail.jsx
│   │   ├── Profile.jsx
│   │   ├── Chats.jsx
│   │   ├── ChatDetail.jsx
│   │   └── AdminPanel.jsx
│   ├── App.jsx            # Main app component with routes
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── supabase/
│   ├── migrations/        # Database migrations
│   │   └── 001_initial_schema.sql
│   └── functions/        # Supabase Edge Functions
│       └── send-expiration-warning/
│           └── index.ts
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── vitest.config.js       # Vitest configuration
└── README.md              # This file
```

## Database Schema

### Tables

- **profiles**: User profiles linked to auth.users
- **listings**: Product listings with images, pricing, location
- **conversations**: Chat conversations between buyers and sellers
- **messages**: Individual messages in conversations
- **reports**: User reports for inappropriate content
- **credit_transactions**: Audit trail for credit transactions

### Key Features

- Row Level Security (RLS) on all tables
- Automatic profile creation on signup
- Listing limit enforcement via database triggers
- Automatic expiration handling
- Real-time subscriptions for chat

## Usage Guide

### For Users

1. **Sign Up**: Create an account with email and password
2. **Browse Listings**: Use search and filters to find items
3. **Contact Sellers**: Click "Contact Seller" to start a chat
4. **Post Listings**: Create listings with images (1 free listing)
5. **Manage Profile**: Edit profile, view listings, check credits

### For Admins

1. **Access Admin Panel**: Navigate to /admin (requires admin role)
2. **Manage Credits**: Add credits to users by email
3. **View Reports**: Review and resolve user reports
4. **Moderate Content**: Delete inappropriate listings or messages

## Listing Credits System

- Each user gets 1 free listing
- Additional listings require 1 credit each
- Renewals also require 1 credit
- Admin can add credits via the admin panel
- Credits are tracked in the `credit_transactions` table

## Email Notifications

The app sends the following emails:

1. **Welcome Email**: Sent when a new user signs up
2. **New Message Notification**: Sent when a user receives a chat message
3. **Expiration Warning**: Sent 3 days before a listing expires (via Edge Function)

## PWA Features

- Installable on mobile devices
- Offline caching of static assets
- Custom app icons
- Standalone display mode
- Mobile-optimized UI with bottom navigation

## Future Enhancements (V2)

- Telegram channel auto-posting
- In-app payment + commission system
- SMS OTP verification (Africa's Talking)
- Seller ratings and reviews
- Saved searches & email alerts
- Listing bumps (paid promotion)
- AI price guidance
- Telegram deep link sharing
- Dark mode toggle
- Multi-language support (Amharic)

## Troubleshooting

### Tailwind CSS Warnings

If you see warnings about `@tailwind` directives, run:

```bash
npm install
```

This will install Tailwind CSS and the warnings will disappear.

### Supabase Connection Issues

- Verify your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active
- Ensure RLS policies are correctly set up

### Image Upload Issues

- Verify the `listing-images` bucket exists in Supabase Storage
- Check bucket policies allow authenticated users to upload
- Ensure file size is under 2MB

### Realtime Chat Not Working

- Verify Realtime is enabled for `conversations` and `messages` tables
- Check your Supabase project has Realtime enabled
- Ensure you're using the correct API key

## Security Considerations

- All API keys are stored in environment variables
- Row Level Security (RLS) is enabled on all tables
- Service role key should never be exposed to the client
- Image uploads are restricted to authenticated users
- File size limits are enforced (2MB max)

## License

This project is provided as-is for educational and commercial use.

## Support

For issues or questions, please contact the development team or open an issue in the repository.

## Acknowledgments

- Built with [Supabase](https://supabase.com)
- UI styled with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Lucide](https://lucide.dev)
- Email delivery via [Resend](https://resend.com)
