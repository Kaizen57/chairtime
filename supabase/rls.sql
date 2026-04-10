-- ============================================
-- ChairTime RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AvailabilitySchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeeklyHours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DateOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WaitlistEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PoolSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's ID from their auth ID
-- Note: auth.uid() returns UUID but authId is TEXT, so we cast
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
  SELECT id FROM "User" WHERE "authId" = auth.uid()::text
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- User policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING ("authId" = auth.uid()::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING ("authId" = auth.uid()::text);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON "User" FOR INSERT
  WITH CHECK ("authId" = auth.uid()::text);

-- ============================================
-- Shop policies
-- ============================================

-- Users can view shops they're members of
CREATE POLICY "Users can view their shops"
  ON "Shop" FOR SELECT
  USING (
    "ownerId" IN (SELECT get_current_user_id())
    OR id IN (SELECT "shopId" FROM "ShopMember" WHERE "userId" IN (SELECT get_current_user_id()))
  );

-- Only owners can update shops
CREATE POLICY "Owners can update shops"
  ON "Shop" FOR UPDATE
  USING ("ownerId" IN (SELECT get_current_user_id()));

-- Only owners can delete shops
CREATE POLICY "Owners can delete shops"
  ON "Shop" FOR DELETE
  USING ("ownerId" IN (SELECT get_current_user_id()));

-- Owners can create shops
CREATE POLICY "Users can create shops"
  ON "Shop" FOR INSERT
  WITH CHECK ("ownerId" IN (SELECT get_current_user_id()));

-- ============================================
-- ShopMember policies
-- ============================================

-- Shop members can view their membership
CREATE POLICY "Members can view shop memberships"
  ON "ShopMember" FOR SELECT
  USING ("userId" IN (SELECT get_current_user_id()));

-- Shop owners can manage members
CREATE POLICY "Owners can manage shop members"
  ON "ShopMember" FOR ALL
  USING (
    "shopId" IN (SELECT id FROM "Shop" WHERE "ownerId" IN (SELECT get_current_user_id()))
    OR "userId" IN (SELECT get_current_user_id())
  );

-- Users can create their own membership
CREATE POLICY "Users can create own membership"
  ON "ShopMember" FOR INSERT
  WITH CHECK ("userId" IN (SELECT get_current_user_id()));

-- ============================================
-- Service policies
-- ============================================

-- Barbers can view their own services
CREATE POLICY "Barbers can view own services"
  ON "Service" FOR SELECT
  USING ("userId" IN (SELECT get_current_user_id()));

-- Barbers can create services
CREATE POLICY "Barbers can create services"
  ON "Service" FOR INSERT
  WITH CHECK ("userId" IN (SELECT get_current_user_id()));

-- Barbers can update their own services
CREATE POLICY "Barbers can update own services"
  ON "Service" FOR UPDATE
  USING ("userId" IN (SELECT get_current_user_id()));

-- Barbers can delete their own services
CREATE POLICY "Barbers can delete own services"
  ON "Service" FOR DELETE
  USING ("userId" IN (SELECT get_current_user_id()));

-- ============================================
-- AvailabilitySchedule policies
-- ============================================

-- Barbers can view their own schedules
CREATE POLICY "Barbers can view own schedules"
  ON "AvailabilitySchedule" FOR SELECT
  USING ("userId" IN (SELECT get_current_user_id()));

-- Barbers can create schedules
CREATE POLICY "Barbers can create schedules"
  ON "AvailabilitySchedule" FOR INSERT
  WITH CHECK ("userId" IN (SELECT get_current_user_id()));

-- Barbers can update their own schedules
CREATE POLICY "Barbers can update own schedules"
  ON "AvailabilitySchedule" FOR UPDATE
  USING ("userId" IN (SELECT get_current_user_id()));

-- Barbers can delete their own schedules
CREATE POLICY "Barbers can delete own schedules"
  ON "AvailabilitySchedule" FOR DELETE
  USING ("userId" IN (SELECT get_current_user_id()));

-- ============================================
-- WeeklyHours policies (child of AvailabilitySchedule)
-- ============================================

CREATE POLICY "Barbers can view own weekly hours"
  ON "WeeklyHours" FOR SELECT
  USING (
    "scheduleId" IN (SELECT id FROM "AvailabilitySchedule" WHERE "userId" IN (SELECT get_current_user_id()))
  );

CREATE POLICY "Barbers can manage own weekly hours"
  ON "WeeklyHours" FOR ALL
  USING (
    "scheduleId" IN (SELECT id FROM "AvailabilitySchedule" WHERE "userId" IN (SELECT get_current_user_id()))
  );

-- ============================================
-- DateOverride policies (child of AvailabilitySchedule)
-- ============================================

CREATE POLICY "Barbers can view own date overrides"
  ON "DateOverride" FOR SELECT
  USING (
    "scheduleId" IN (SELECT id FROM "AvailabilitySchedule" WHERE "userId" IN (SELECT get_current_user_id()))
  );

CREATE POLICY "Barbers can manage own date overrides"
  ON "DateOverride" FOR ALL
  USING (
    "scheduleId" IN (SELECT id FROM "AvailabilitySchedule" WHERE "userId" IN (SELECT get_current_user_id()))
  );

-- ============================================
-- Appointment policies
-- ============================================

-- Barbers can view their own appointments
CREATE POLICY "Barbers can view own appointments"
  ON "Appointment" FOR SELECT
  USING ("barberId" IN (SELECT get_current_user_id()));

-- Barbers can create appointments for themselves
CREATE POLICY "Barbers can create appointments"
  ON "Appointment" FOR INSERT
  WITH CHECK ("barberId" IN (SELECT get_current_user_id()));

-- Barbers can update their own appointments
CREATE POLICY "Barbers can update own appointments"
  ON "Appointment" FOR UPDATE
  USING ("barberId" IN (SELECT get_current_user_id()));

-- Barbers can delete their own appointments
CREATE POLICY "Barbers can delete own appointments"
  ON "Appointment" FOR DELETE
  USING ("barberId" IN (SELECT get_current_user_id()));

-- ============================================
-- Contact policies
-- ============================================

-- Barbers can view their own contacts
CREATE POLICY "Barbers can view own contacts"
  ON "Contact" FOR SELECT
  USING ("barberId" IN (SELECT get_current_user_id()));

-- Barbers can create contacts for themselves
CREATE POLICY "Barbers can create contacts"
  ON "Contact" FOR INSERT
  WITH CHECK ("barberId" IN (SELECT get_current_user_id()));

-- Barbers can update their own contacts
CREATE POLICY "Barbers can update own contacts"
  ON "Contact" FOR UPDATE
  USING ("barberId" IN (SELECT get_current_user_id()));

-- Barbers can delete their own contacts
CREATE POLICY "Barbers can delete own contacts"
  ON "Contact" FOR DELETE
  USING ("barberId" IN (SELECT get_current_user_id()));

-- ============================================
-- WaitlistEntry policies
-- ============================================

-- Barbers can view their own queue entries
CREATE POLICY "Barbers can view own queue"
  ON "WaitlistEntry" FOR SELECT
  USING (
    "barberId" IN (SELECT get_current_user_id())
    OR "shopId" IN (SELECT id FROM "Shop" WHERE "ownerId" IN (SELECT get_current_user_id()))
    OR "shopId" IN (SELECT "shopId" FROM "ShopMember" WHERE "userId" IN (SELECT get_current_user_id()))
  );

-- Barbers can create queue entries for themselves
CREATE POLICY "Barbers can create queue entries"
  ON "WaitlistEntry" FOR INSERT
  WITH CHECK (
    "barberId" IN (SELECT get_current_user_id())
    OR "shopId" IN (SELECT id FROM "Shop" WHERE "ownerId" IN (SELECT get_current_user_id()))
    OR "shopId" IN (SELECT "shopId" FROM "ShopMember" WHERE "userId" IN (SELECT get_current_user_id()))
  );

-- Barbers can update their own queue entries
CREATE POLICY "Barbers can update own queue entries"
  ON "WaitlistEntry" FOR UPDATE
  USING (
    "barberId" IN (SELECT get_current_user_id())
    OR "shopId" IN (SELECT id FROM "Shop" WHERE "ownerId" IN (SELECT get_current_user_id()))
    OR "shopId" IN (SELECT "shopId" FROM "ShopMember" WHERE "userId" IN (SELECT get_current_user_id()))
  );

-- Anyone can insert (public join queue)
-- Keep SELECT unrestricted for public viewing
CREATE POLICY "Public can view waitlist"
  ON "WaitlistEntry" FOR SELECT
  USING (true);

-- ============================================
-- PoolSlot policies
-- ============================================

-- Barbers can view their own pool slots
CREATE POLICY "Barbers can view own pool slots"
  ON "PoolSlot" FOR SELECT
  USING ("barberId" IN (SELECT get_current_user_id()));

-- Barbers can create pool slots for themselves
CREATE POLICY "Barbers can create pool slots"
  ON "PoolSlot" FOR INSERT
  WITH CHECK ("barberId" IN (SELECT get_current_user_id()));

-- Barbers can update their own pool slots
CREATE POLICY "Barbers can update own pool slots"
  ON "PoolSlot" FOR UPDATE
  USING ("barberId" IN (SELECT get_current_user_id()));

-- Barbers can delete their own pool slots
CREATE POLICY "Barbers can delete own pool slots"
  ON "PoolSlot" FOR DELETE
  USING ("barberId" IN (SELECT get_current_user_id()));

-- Anyone can select (public viewing)
CREATE POLICY "Public can view pool slots"
  ON "PoolSlot" FOR SELECT
  USING (true);

-- ============================================
-- Verify policies created
-- ============================================
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
