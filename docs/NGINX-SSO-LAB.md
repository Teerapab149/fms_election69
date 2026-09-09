# PSU SSO callback: isolated nginx reproduction

## What this proves (and does not)

The local lab reproduces nginx `502` / `upstream sent too big header` using
the installed NextAuth JWT encoder and cookie chunker, with **synthetic** ID
tokens. Increasing bounded nginx buffers restores the expected 302 response.
It does not establish the university's root cause without their logs/config.
No real SSO codes, credentials, sessions, or database records are used.

## Reproduce

From the repository root (Docker Desktop Linux containers + npm dependencies):

```sh
docker compose -p fms-nginx-lab -f scripts/nginx-lab/compose.yml up -d
docker compose -p fms-nginx-lab -f scripts/nginx-lab/compose.yml exec -T nginx nginx -t
node scripts/nginx-lab/check.cjs
```

Loopback-only ports: 8180 = nginx defaults; 8181 = corrected buffers.
Fixture is a Node HTTP upstream, **not a full successful OAuth callback**.
It uses real NextAuth encoding/chunking but synthetic payloads. The actual
production app is a separate lab below.

Observed output:

```text
id_token=0B baseline=302 fixed=302 cookie_headers=356B chunks=1
id_token=2048B baseline=302 fixed=302 cookie_headers=3087B chunks=1
id_token=4096B baseline=502 fixed=302 cookie_headers=5909B chunks=2
id_token=8192B baseline=502 fixed=302 cookie_headers=11459B chunks=3
id_token=16384B baseline=502 fixed=302 cookie_headers=22649B chunks=6
PASS: 5 response comparisons + 4 cookie round trips
```

The test client deliberately allows 64KB response headers for measurement.
The 16KB synthetic ID token is tested only on the response path: its encoded
Cookie exceeds Node's default request-header limit. These buffers do **not**
promise support for arbitrarily large sessions. Real sizes must be measured;
very large sessions require reducing payloads or server-side token storage.

## Production-mode app behind nginx

```sh
docker compose -p fms-production-lab -f scripts/nginx-lab/production.yml up -d --build
```

App: http://localhost:8182. Separate PostgreSQL: loopback port 5439,
database `nginx_lab`, lab-only username `lab` and password `isolated-lab-only`.
Apply existing migrations to **this database only** before testing DB features.
For PowerShell, use a child-process-only URL override (does not edit `.env`):

```powershell
node -e "const {spawnSync}=require('node:child_process'); const r=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{stdio:'inherit',env:{...process.env,DATABASE_URL:'postgresql://lab:isolated-lab-only@127.0.0.1:5439/nginx_lab'}}); process.exit(r.status??1)"
node scripts/nginx-lab/check-production.cjs
```

Verified on this run:

```text
✓ Compiled successfully in 28.1s
✓ Generating static pages (26/26)
All migrations have been successfully applied.
/api/health 200
/login 200
/api/auth/session 200
/admin 307 http://localhost:8182/admin/login
PASS: production NextAuth session 200, 8192B ID token preserved, refreshed cookies received, isAdmin=false
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Build completed, with existing build-time missing-DATABASE_URL fallback logs
(runtime DB is configured separately), Prisma deprecation warnings, and npm
audit reporting 21 dependency vulnerabilities. No dependency upgrades were
attempted in this nginx fix. The session test is synthetic and does not call PSU.

No production `.env` is loaded. Mock login is not enabled. No admin is seeded.
This is HTTP loopback, not the university's HTTPS/DNS/firewall configuration.
Real PSU SSO end-to-end requires a registered local/test callback and separately
authorized test credentials. Do not reuse an authorization code from a 502 URL.

## Proposed production fix for IT

Copy `deploy/nginx/auth-proxy-buffers.conf` onto the nginx host and include it
inside the existing **server block** for `ovs.fms.psu.ac.th`. Preserve existing
TLS, upstream, forwarded headers, and domain settings. It must cover both the
callback and session-refresh endpoints, not only one callback URL.

```nginx
server {
    # Existing settings remain here.
    include /etc/nginx/snippets/auth-proxy-buffers.conf;
}
```

Before reload, IT must back up the current config, run `nginx -t`, and check
for more-specific location overrides. Reload only after validation. Retest with
a **new login**, then session refresh and logout. If the 502 persists, inspect
the actual error; don't keep increasing buffer sizes blindly. Rollback is
removing the include and restoring the backed-up settings, testing, reloading.
No application change removes `id_token`; SSO logout remains intact.

Access logs in the lab omit query strings. Nginx **error logs may still contain
request URLs**: redact OAuth code/state, cookies, tokens, and personal data
before sharing production logs.

## Stop (without deleting data)

```sh
docker compose -p fms-nginx-lab -f scripts/nginx-lab/compose.yml stop
docker compose -p fms-production-lab -f scripts/nginx-lab/production.yml stop
```

Do not use `down -v` on another project's Compose file. The production-mode
lab DB is disposable and never points at the normal local or production DB.
