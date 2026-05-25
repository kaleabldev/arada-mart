-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  telegram_handle TEXT,
  free_listings_used INTEGER DEFAULT 0,
  listing_credits INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  negotiable BOOLEAN DEFAULT false,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
  category TEXT NOT NULL CHECK (category IN ('Phones', 'Laptops', 'Tablets', 'Headphones', 'Accessories', 'Other')),
  location_text TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  images TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id, seller_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_reported BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_transactions table (optional for audit)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('admin_grant', 'listing_fee', 'renewal_fee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_expires_at ON listings(expires_at);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for listings
CREATE POLICY "Active listings are viewable by everyone"
  ON listings FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

CREATE POLICY "Sellers can insert own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can update any listing"
  ON listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for conversations
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for messages
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Participants can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
    AND auth.uid() = sender_id
  );

-- RLS Policies for reports
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, free_listings_used, listing_credits, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    0,
    0,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check listing limit before insert
CREATE OR REPLACE FUNCTION public.check_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
  active_count INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = NEW.seller_id;
  
  -- Count active listings
  SELECT COUNT(*) INTO active_count 
  FROM listings 
  WHERE seller_id = NEW.seller_id AND status = 'active' AND expires_at > NOW();
  
  -- Check if user can create listing
  IF active_count >= 1 AND user_profile.listing_credits <= 0 THEN
    RAISE EXCEPTION 'Listing limit reached. Purchase credits to post more listings.';
  END IF;
  
  -- If using credit, deduct it
  IF active_count >= 1 AND user_profile.listing_credits > 0 THEN
    UPDATE profiles SET listing_credits = listing_credits - 1 WHERE id = NEW.seller_id;
    INSERT INTO credit_transactions (user_id, amount, reason)
    VALUES (NEW.seller_id, -1, 'listing_fee');
  ELSE
    UPDATE profiles SET free_listings_used = free_listings_used + 1 WHERE id = NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check listing limit
CREATE TRIGGER check_listing_limit_trigger
  BEFORE INSERT ON listings
  FOR EACH ROW EXECUTE FUNCTION public.check_listing_limit();

-- Function to expire old listings (can be called by pg_cron)
CREATE OR REPLACE FUNCTION public.expire_old_listings()
RETURNS VOID AS $$
BEGIN
  UPDATE listings
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
