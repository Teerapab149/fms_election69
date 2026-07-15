-- v2-SEC — anonymous, encrypted, tamper-evident ballots (owner-LOCKED "B+", 60e0de2)
--
-- ┌── PRODUCTION MIGRATION NOTE — READ BEFORE APPLYING TO A REAL ELECTION DB ──┐
-- │ This migration DROPS "User"."candidateId" (the who-voted-for-whom link).   │
-- │ In production you MUST freeze the tally first: run the admin action        │
-- │ ANONYMIZE_BALLOTS (writes final counts into "Candidate"."score") BEFORE    │
-- │ applying this migration. Applying it first discards the ballot link WITHOUT │
-- │ the score being frozen from it. In dev the link is disposable seed data.   │
-- │ Also: run this DDL as a PRIVILEGED role — NOT the INSERT-only app role      │
-- │ granted in scripts/sql/ballot-grants.sql (that role cannot ALTER/CREATE).   │
-- └────────────────────────────────────────────────────────────────────────────┘

-- 1. User: drop the direct vote link + its FK; add the voter's OWN vote time
--    (votedAt is non-secret — it drives the personal success receipt and never
--    links to a Ballot row).
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_candidateId_fkey";
ALTER TABLE "User" DROP COLUMN IF EXISTS "candidateId";
ALTER TABLE "User" ADD COLUMN "votedAt" TIMESTAMP(3);

-- 2. Ballot: append-only, unlinkable, encrypted, hash-chained. No userId, no
--    fine timestamp (hourBucket at most). payload = RSA-OAEP ciphertext.
CREATE TABLE "Ballot" (
    "seq" SERIAL NOT NULL,
    "payload" TEXT NOT NULL,
    "hourBucket" TEXT,
    "prevHash" TEXT NOT NULL,
    "rowHash" TEXT NOT NULL,
    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("seq")
);

-- 3. ChainHead: single-row (id=1) tip of the chain. The UPDATE ... WHERE id=1
--    inside the vote transaction takes the row lock that serializes concurrent
--    votes into a gap-free, verifiable chain.
CREATE TABLE "ChainHead" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "head" TEXT NOT NULL DEFAULT 'GENESIS',
    "seq" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ChainHead_pkey" PRIMARY KEY ("id")
);

-- 4. Genesis head — the chain starts from a fixed anchor. Idempotent so a
--    re-run (or a seed that also ensures it) cannot create a second head.
INSERT INTO "ChainHead" ("id", "head", "seq") VALUES (1, 'GENESIS', 0)
    ON CONFLICT ("id") DO NOTHING;
