-- Enable PostGIS for geo queries
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "locationLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "locationLng" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "locationGeo" geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS "locationUpdatedAt" TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Profile_locationGeo_idx" ON "Profile" USING GIST ("locationGeo");
