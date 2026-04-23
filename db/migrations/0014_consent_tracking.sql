-- Track RGPD art. 7 consent for student data submission.
-- consent_given_at = timestamp at which the student ticked the consent checkbox.
-- consent_version  = semver-like identifier of the privacy notice shown at that time.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS consent_given_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version varchar(20);
