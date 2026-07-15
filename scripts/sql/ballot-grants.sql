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
GRANT SELECT, INSERT, UPDATE ON TABLE "Candidate"    TO fms_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Member" TO fms_app; -- admin CRUD
GRANT SELECT, INSERT, UPDATE ON TABLE "SystemConfig" TO fms_app;
GRANT SELECT, INSERT           ON TABLE "AdminAuditLog" TO fms_app; -- append-only
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Template" TO fms_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fms_app;

-- ── Verify the lockdown took (run as fms_app or inspect information_schema):
--   SELECT privilege_type FROM information_schema.role_table_grants
--   WHERE grantee='fms_app' AND table_name='Ballot';
--   -- expect exactly: SELECT, INSERT   (no UPDATE / DELETE)
