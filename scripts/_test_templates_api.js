/**
 * Automated API test runner for Phase 3 Step 1.
 *
 * Performs NextAuth mock-login then exercises all 8 template endpoints.
 *
 * Note: requires dev server running on PORT (default 3001) with mock-login
 * provider enabled (NEXT_PUBLIC_ENABLE_MOCK_LOGIN=true).
 */

const PORT = process.env.PORT || 3001;
const BASE = `http://localhost:${PORT}/fms-ovs`;
const ADMIN_ID = "6610510149";

// Naive cookie jar
const cookies = new Map();

function setCookies(setCookieHeaders) {
  if (!setCookieHeaders) return;
  const list = Array.isArray(setCookieHeaders) ? setCookieHeaders : setCookieHeaders.split(/,\s*(?=[A-Za-z0-9_.-]+=)/);
  for (const raw of list) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) {
      cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
}

function cookieHeader() {
  return Array.from(cookies.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}

async function request(method, path, body, extraHeaders) {
  const headers = {
    "Cookie": cookieHeader(),
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(extraHeaders || {})
  };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    redirect: "manual"
  });
  setCookies(res.headers.getSetCookie ? res.headers.getSetCookie() : res.headers.get("set-cookie"));
  let parsed = null;
  const text = await res.text();
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: res.status, body: parsed, raw: text };
}

async function login() {
  console.log("=== STEP 0: Mock Login ===");

  // 1) Fetch CSRF token
  const csrfRes = await request("GET", "/api/auth/csrf");
  if (csrfRes.status !== 200) {
    throw new Error(`CSRF fetch failed: ${csrfRes.status}`);
  }
  const csrfToken = csrfRes.body.csrfToken;
  console.log("  CSRF token obtained:", csrfToken.slice(0, 12) + "...");

  // 2) Submit credentials to mock-login provider
  const params = new URLSearchParams({
    studentId: ADMIN_ID,
    csrfToken,
    callbackUrl: `${BASE}/admin`,
    json: "true"
  });

  const loginRes = await request("POST", "/api/auth/callback/mock-login", params.toString(), {
    "Content-Type": "application/x-www-form-urlencoded"
  });

  console.log("  Login response status:", loginRes.status);
  console.log("  Cookies captured:", Array.from(cookies.keys()).join(", "));

  // 3) Verify session
  const sessionRes = await request("GET", "/api/auth/session");
  console.log("  Session check:", JSON.stringify(sessionRes.body).slice(0, 200));

  if (!sessionRes.body || !sessionRes.body.user) {
    throw new Error("Login did not establish a session");
  }
  if (sessionRes.body.user.role !== "ADMIN" && sessionRes.body.user.role !== "STAFF") {
    throw new Error(`User role is "${sessionRes.body.user.role}", expected ADMIN/STAFF`);
  }
  console.log("  ✅ Logged in as", sessionRes.body.user.studentId, "role=" + sessionRes.body.user.role);
}

function showResult(label, res) {
  console.log(`\n=== ${label} ===`);
  console.log(`  Status: ${res.status}`);
  console.log(`  Body:   ${typeof res.body === "string" ? res.body.slice(0, 300) : JSON.stringify(res.body).slice(0, 600)}`);
}

async function runTests() {
  let pass = 0, fail = 0;
  const check = (label, expected, actual) => {
    if (actual === expected) {
      console.log(`  ✅ ${label} (status=${actual})`);
      pass++;
    } else {
      console.log(`  ❌ ${label} (expected=${expected}, got=${actual})`);
      fail++;
    }
  };

  // Test 1: list
  const t1 = await request("GET", "/api/admin/templates");
  showResult("Test 1: GET /api/admin/templates", t1);
  check("Test 1: status 200", 200, t1.status);
  if (t1.body?.count !== undefined) {
    console.log(`  Count = ${t1.body.count} (expected >= 4 built-ins)`);
  }

  // Test 2: get classic
  const t2 = await request("GET", "/api/admin/templates/classic");
  showResult("Test 2: GET /api/admin/templates/classic", t2);
  check("Test 2: status 200", 200, t2.status);
  check("Test 2: classic.isBuiltIn=true", true, t2.body?.template?.isBuiltIn === true);

  // Test 3: edit built-in (should 403)
  const t3 = await request("PUT", "/api/admin/templates/classic", { name: "Hacked" });
  showResult("Test 3: PUT classic (should 403)", t3);
  check("Test 3: status 403", 403, t3.status);

  // Test 4: create custom
  const t4 = await request("POST", "/api/admin/templates", {
    slug: "test-fork",
    name: "Test Template",
    description: "Manual test from Phase 3 Step 1",
    pages:    { home: { visible: true } },
    elements: {},
    theme:    { colors: { primary: "#ff0000" } }
  });
  showResult("Test 4: POST custom (test-fork)", t4);
  check("Test 4: status 201", 201, t4.status);

  // Test 5: apply test-fork
  const t5 = await request("POST", "/api/admin/templates/test-fork/apply");
  showResult("Test 5: POST apply test-fork", t5);
  check("Test 5: status 200", 200, t5.status);
  check("Test 5: activeTemplateId=test-fork", "test-fork", t5.body?.activeTemplateId);

  // Test 6: lock
  const t6 = await request("POST", "/api/admin/templates/test-fork/lock", {});
  showResult("Test 6: POST lock test-fork", t6);
  check("Test 6: status 200", 200, t6.status);
  check("Test 6: isLocked=true", true, t6.body?.template?.isLocked === true);

  // Test 7: delete locked (should fail; might be 403 locked OR 409 active)
  const t7 = await request("DELETE", "/api/admin/templates/test-fork");
  showResult("Test 7: DELETE locked test-fork (should fail)", t7);
  if (t7.status === 403 || t7.status === 409) {
    console.log(`  ✅ Test 7: rejected delete (status=${t7.status})`);
    pass++;
  } else {
    console.log(`  ❌ Test 7: expected 403/409, got ${t7.status}`);
    fail++;
  }

  // Test 8: cleanup — apply classic, unlock, delete
  const t8a = await request("POST", "/api/admin/templates/classic/apply");
  showResult("Test 8a: POST apply classic (cleanup)", t8a);
  check("Test 8a: status 200", 200, t8a.status);

  const t8b = await request("POST", "/api/admin/templates/test-fork/lock", { lock: false });
  showResult("Test 8b: POST unlock test-fork", t8b);
  check("Test 8b: status 200", 200, t8b.status);
  check("Test 8b: isLocked=false", false, t8b.body?.template?.isLocked === true);

  const t8c = await request("DELETE", "/api/admin/templates/test-fork");
  showResult("Test 8c: DELETE test-fork", t8c);
  check("Test 8c: status 200", 200, t8c.status);

  console.log(`\n=== SUMMARY: ${pass} pass, ${fail} fail ===`);
  if (fail > 0) process.exit(1);
}

(async () => {
  try {
    await login();
    await runTests();
  } catch (err) {
    console.error("FATAL:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
