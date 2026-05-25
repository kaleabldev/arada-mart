-- Rename listing_credits to credits in profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='listing_credits') THEN
    ALTER TABLE profiles RENAME COLUMN listing_credits TO credits;
  END IF;
END $$;

-- Ensure view_count and status are correct
ALTER TABLE listings ALTER COLUMN view_count SET DEFAULT 0;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check CHECK (status IN ('active', 'sold', 'expired', 'hidden'));

-- RPC for incrementing views
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Logic - Listing Limits: Create a PostgreSQL trigger
CREATE OR REPLACE FUNCTION public.check_listing_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = NEW.seller_id;

  -- Check if user can create listing
  -- If they already have 1 free listing AND 0 credits, prevent insert.
  IF user_profile.free_listings_used >= 1 AND user_profile.credits <= 0 THEN
    RAISE EXCEPTION 'Listing limit reached. Purchase credits to post more listings.';
  END IF;

  -- If they have credits (>0) and already used their free listing, deduct 1 credit.
  IF user_profile.free_listings_used >= 1 AND user_profile.credits > 0 THEN
    UPDATE profiles SET credits = credits - 1 WHERE id = NEW.seller_id;
    INSERT INTO credit_transactions (user_id, amount, reason)
    VALUES (NEW.seller_id, -1, 'listing_fee');
  ELSIF user_profile.free_listings_used < 1 THEN
    -- Otherwise, use the free listing
    UPDATE profiles SET free_listings_used = free_listings_used + 1 WHERE id = NEW.seller_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS check_listing_limit_trigger ON listings;
CREATE TRIGGER check_listing_limit_trigger
  BEFORE INSERT ON listings
  FOR EACH ROW EXECUTE FUNCTION public.check_listing_limit();

-- Logic - Expiration: Update status to 'expired' for any listing where expires_at < now()
CREATE OR REPLACE FUNCTION public.expire_old_listings()
RETURNS VOID AS $$
BEGIN
  UPDATE listings
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
