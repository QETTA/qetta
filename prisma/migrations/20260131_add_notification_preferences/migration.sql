-- AlterTable
ALTER TABLE "User" ADD COLUMN "notificationPreferences" JSONB;

-- This migration adds a JSON field to store user notification preferences
-- Expected structure:
-- {
--   "email": {
--     "applicationStatus": true,
--     "documentGeneration": true,
--     "systemUpdates": true,
--     "weeklyDigest": false,
--     "marketingEmails": false
--   },
--   "push": {
--     "applicationUpdates": true,
--     "documentReady": true,
--     "systemAlerts": true
--   }
-- }
