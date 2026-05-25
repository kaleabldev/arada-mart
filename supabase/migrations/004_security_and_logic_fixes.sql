-- 1. Fix Listing Visibility: Allow sellers to see ALL their own listings (Active, Sold, Expired)
DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON listings;
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

CREATE POLICY "Sellers can view all own listings"
  ON listings FOR SELECT
  USING (auth.uid() = seller_id);

-- 2. Fix Profile Security: Prevent users from updating their own 'credits', 'role', or 'free_listings_used'
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile details"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- This prevents the user from changing these specific columns in an UPDATE call
    (CASE WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' THEN true ELSE
      credits = (SELECT credits FROM profiles WHERE id = auth.uid()) AND
      role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
      free_listings_used = (SELECT free_listings_used FROM profiles WHERE id = auth.uid())
    END)
  );

-- 3. Secure Renewal RPC: Atomic server-side credit deduction and renewal
CREATE OR REPLACE FUNCTION renew_listing(target_listing_id UUID)
RETURNS VOID AS $$
DECLARE
  listing_owner_id UUID;
  user_credits INTEGER;
  user_free_used INTEGER;
BEGIN
  -- Get listing info
  SELECT seller_id INTO listing_owner_id FROM listings WHERE id = target_listing_id;

  -- Check ownership
  IF listing_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to renew this listing';
  END IF;

  -- Get user info
  SELECT credits, free_listings_used INTO user_credits, user_free_used FROM profiles WHERE id = auth.uid();

  -- Business Logic: Must have 1 credit OR have not used free listing
  IF user_free_used >= 1 AND user_credits <= 0 THEN
    RAISE EXCEPTION 'Insufficient credits to renew listing';
  END IF;

  -- Deduct credit or use free slot
  IF user_free_used >= 1 THEN
    UPDATE profiles SET credits = credits - 1 WHERE id = auth.uid();
    INSERT INTO credit_transactions (user_id, amount, reason)
    VALUES (auth.uid(), -1, 'renewal_fee');
  ELSE
    UPDATE profiles SET free_listings_used = free_listings_used + 1 WHERE id = auth.uid();
  END IF;

  -- Update listing
  UPDATE listings
  SET
    status = 'active',
    expires_at = NOW() + INTERVAL '30 days',
    created_at = NOW() -- Optional: refresh the sort order
  WHERE id = target_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
