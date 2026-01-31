-- Enable PostGIS for geo queries
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "locationLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "locationLng" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "locationGeo" geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS "locationUpdatedAt" TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Profile_locationGeo_idx" ON "Profile" USING GIST ("locationGeo");

-- Create trigger function to auto-sync locationGeo from lat/lng
CREATE OR REPLACE FUNCTION sync_location_geo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."locationLat" IS NOT NULL AND NEW."locationLng" IS NOT NULL THEN
    NEW."locationGeo" := ST_SetSRID(ST_MakePoint(NEW."locationLng", NEW."locationLat"), 4326)::geography;
    NEW."locationUpdatedAt" := NOW();
  ELSIF NEW."locationLat" IS NULL OR NEW."locationLng" IS NULL THEN
    NEW."locationGeo" := NULL;
    NEW."locationUpdatedAt" := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before insert or update
CREATE TRIGGER trigger_sync_location_geo
  BEFORE INSERT OR UPDATE OF "locationLat", "locationLng"
  ON "Profile"
  FOR EACH ROW
  EXECUTE FUNCTION sync_location_geo();
