-- scripts/sql/ballot-grants.sql — v2-SEC least-privilege grants for PRODUCTION.
--
-- ⚠️ NOT applied in dev. This is a documented ceremony for the production DB.
--
-- The point: even if the application server is fully compromised, the DB ROLE it
-- connects as must be STRUCTURALLY UNABLE to rewrite a cast ballot. Tamper-
-- evidence (the HMAC chain) tells you IF someone edited the box; these grants
-- make it so the app itself CANNOT. A DB superuser always can — no system stops
-- that — but "edit a ballot without being caught" then requires the chain secret
-- AND superuser AND rewriting every exported chain-head record. That is the real
-- mechanism this delivers.
--
-- ── Roles ────────────────────────────────────────────────────────────────────
-- Assumes two roles:
--   fms_migrate  — owns the schema; runs prisma migrate / DDL. NOT used by the app.
--   fms_app      — the role in the app's DATABASE_URL. Least privilege below.
-- Create fms_app once (choose a strong password, store it only in the server env):
--
--   CREATE ROLE fms_app LOGIN PASSWORD '<<set-in-env-only>>';
--   GRANT CONNECT ON DATABASE fms_election TO fms_app;
--   GRANT USAGE  ON SCHEMA public TO fms_app;
--
-- Run everything below as the schema owner (fms_migrate / superuser), AFTER the
-- v2-SEC migration has created "Ballot" and "ChainHead".

-- ── Ballot: APPEND-ONLY. The app can add a ballot and read the box; it can
--    NEVER update or delete one. This is the structural core of the guarantee.
REVOKE ALL ON TABLE "Ballot" FROM fms_app;
GRANT  SELECT, INSERT ON TABLE "Ballot" TO fms_app;
-- (deliberately NO UPDATE, NO DELETE, NO TRUNCATE)
-- "seq" is a SERIAL; the app supplies seq explicitly, but keep sequence usage
-- available so a fallback autoincrement insert would still work:
GRANT USAGE, SELECT ON SEQUENCE "Ballot_seq_seq" TO fms_app;

-- ── ChainHead: single-row chain tip. The app must SELECT ... FOR UPDATE and
--    advance it, so it needs SELECT + UPDATE. It must NOT delete the row.
--    Editing ChainHead alone cannot hide tampering: verify recomputes the tip
--    from the (immutable) Ballot rows and compares — a doctored head fails the
--    head-matches check.
REVOKE ALL ON TABLE "ChainHead" FROM fms_app;
GRANT  SELECT, UPDATE ON TABLE "ChainHead" TO fms_app;

-- ── User: the app legitimately writes many columns (PSU SSO sync on login:
--    name/email/role/isAdmin, plus the vote's isVoted/votedAt). Full column
--    lockdown here would break sign-in, so we grant table UPDATE but call out
--    the vote-critical columns. If you split SSO sync onto a different role in a
--    later phase, restrict this to the two vote columns:
--        GRANT UPDATE (isVoted, votedAt) ON TABLE "User" TO fms_app;
REVOKE ALL ON TABLE "User" FROM fms_app;
GRANT  SELECT, INSERT, UPDATE ON TABLE "User" TO fms_app;
-- (no DELETE — voters are not deleted by the app; roster changes are a DBA task)

-- ── Everything else the app reads/writes normally (candidates, config, audit).
--    Candidate.score is incremented at vote time → needs UPDATE. AdminAuditLog is
--    append-only accountability → INSERT + SELECT, no UPDATE/DELETE.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Member" TO fms_app; -- admin CRUD
GRANT SELECT, INSERT, UPDATE ON TABLE "SystemConfig" TO fms_app;
GRANT SELECT, INSERT           ON TABLE "AdminAuditLog" TO fms_app; -- append-only
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Candidate" TO fms_app; -- admin CRUD (see below)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Template" TO fms_app;

-- ── ⚠️ SEQUENCES — the line that bit us in 2569 ──────────────────────────────
-- Adding a party from the admin console failed on the production server while
-- DELETE worked, which reads like a table-privilege problem and is not: INSERT on
-- a SERIAL id calls nextval() on "Candidate_id_seq", and a role holding INSERT on
-- the TABLE but nothing on the SEQUENCE gets "permission denied for sequence".
-- DELETE never touches the sequence, so it kept working — the exact asymmetry that
-- makes this confusing to diagnose. Two grants are needed, not one:
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fms_app;
-- ...and the same for anything created later (a future migration adds a table →
-- its sequence would otherwise arrive ungranted and break inserts all over again):
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO fms_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO fms_app;

-- ── Verify (run these after applying — do not skip) ───────────────────────────
--
-- 1. the ballot box is append-only:
--   SELECT privilege_type FROM information_schema.role_table_grants
--   WHERE grantee='fms_app' AND table_name='Ballot';
--   -- expect exactly: SELECT, INSERT   (no UPDATE / DELETE)
--
-- 2. the app can actually create a party (this is what broke last year).
--    Run AS fms_app; it rolls back, so nothing is left behind:
--   BEGIN;
--     INSERT INTO "Candidate" (name, number) VALUES ('__grant probe__', 9999);
--   ROLLBACK;
--   -- expect: INSERT 0 1. "permission denied for sequence Candidate_id_seq"
--   -- means the two sequence grants above did not apply.
--
--    `npm run preflight` runs this same probe automatically — see
--    scripts/preflight-year.js. Prefer that; it needs no psql session.
