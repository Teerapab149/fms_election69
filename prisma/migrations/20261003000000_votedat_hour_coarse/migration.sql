-- H3 (2026-10-03): User.votedAt is stored to the hour from now on (vote route
-- floors it, same granularity as Ballot.hourBucket). Before this, votedAt was
-- exact to the millisecond and Ballot.seq is cast order, so ORDER BY votedAt
-- lined every voter up with their ballot. Coarsen the rows already written.
-- date_trunc('hour') in UTC equals the Bangkok hour: Bangkok is UTC+7, whole
-- hours, no DST. Idempotent.
UPDATE "User" SET "votedAt" = date_trunc('hour', "votedAt") WHERE "votedAt" IS NOT NULL;
