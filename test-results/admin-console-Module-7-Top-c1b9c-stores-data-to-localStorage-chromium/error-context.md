# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-console.spec.js >> Module 7: Top Navigation (Preview Mode & Save/Publish) >> TC7.2 - Save Draft button stores data to localStorage
- Location: e2e\admin-console.spec.js:461:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: 'บันทึกร่าง' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button').filter({ hasText: 'บันทึกร่าง' }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e8]
      - heading "Administrator" [level=1] [ref=e10]
      - paragraph [ref=e11]: เฉพาะเจ้าหน้าที่/กรรมการเลือกตั้ง
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - img [ref=e15]
          - text: ระบบขัดข้อง กรุณาลองใหม่ภายหลัง
        - generic [ref=e17]:
          - generic [ref=e18]: Username
          - textbox "Enter admin username" [ref=e20]: "6610510149"
        - generic [ref=e21]:
          - generic [ref=e22]: Password
          - textbox "••••••••" [ref=e24]: 6610510149@email.psu.ac.th+ADMIN_FMS2026_2026_secret_9QpZxL
        - button "Login to System" [ref=e25] [cursor=pointer]:
          - generic [ref=e28]:
            - text: Login to System
            - img [ref=e29]
      - link "← Back to Home" [ref=e32] [cursor=pointer]:
        - /url: /fms-ovs
        - generic [ref=e33]: ←
        - text: Back to Home
  - alert [ref=e34]
```

# Test source

```ts
  363 |     const value = await inputField.inputValue();
  364 |     expect(value).toBe('SAMO 50 TEST');
  365 |   });
  366 | 
  367 |   test('TC6.3 - Enter academic year 2570 → system accepts numeric value', async ({ page }) => {
  368 |     const yearLabel = page.locator('label').filter({ hasText: 'ปีการศึกษา' });
  369 |     await expect(yearLabel.first()).toBeVisible({ timeout: 10000 });
  370 | 
  371 |     const inputField = yearLabel.first().locator('..').locator('..').locator('input').first();
  372 |     await inputField.clear();
  373 |     await inputField.fill('2570');
  374 |     await page.waitForTimeout(500);
  375 | 
  376 |     const value = await inputField.inputValue();
  377 |     expect(value).toBe('2570');
  378 |   });
  379 | 
  380 |   test('TC6.4 - [Edge Case] Special characters and emojis in organization name', async ({ page }) => {
  381 |     const orgLabel = page.locator('label').filter({ hasText: 'ชื่อองค์กร' });
  382 | 
  383 |     if (await orgLabel.count() > 0) {
  384 |       await expect(orgLabel.first()).toBeVisible({ timeout: 10000 });
  385 |       const inputField = orgLabel.first().locator('..').locator('..').locator('input').first();
  386 |       const testValue = 'สโมสรนักศึกษา 🚀 <test>';
  387 |       await inputField.clear();
  388 |       await inputField.fill(testValue);
  389 |       await page.waitForTimeout(500);
  390 | 
  391 |       // Should not crash
  392 |       const errorBoundary = page.locator('text=Something went wrong');
  393 |       await expect(errorBoundary).toHaveCount(0);
  394 | 
  395 |       const value = await inputField.inputValue();
  396 |       expect(value.length).toBeGreaterThan(0);
  397 |     }
  398 |   });
  399 | 
  400 |   test('TC6.5 - [Edge Case] Long text (200 chars) in organization name → layout does not break', async ({ page }) => {
  401 |     const orgLabel = page.locator('label').filter({ hasText: 'ชื่อองค์กร' });
  402 | 
  403 |     if (await orgLabel.count() > 0) {
  404 |       await expect(orgLabel.first()).toBeVisible({ timeout: 10000 });
  405 |       const inputField = orgLabel.first().locator('..').locator('..').locator('input').first();
  406 |       const longText = 'A'.repeat(200);
  407 |       await inputField.clear();
  408 |       await inputField.fill(longText);
  409 |       await page.waitForTimeout(500);
  410 | 
  411 |       // Verify the admin UI doesn't break
  412 |       const errorBoundary = page.locator('text=Something went wrong');
  413 |       await expect(errorBoundary).toHaveCount(0);
  414 | 
  415 |       const mainContent = page.locator('main');
  416 |       await expect(mainContent).toBeVisible();
  417 | 
  418 |       const value = await inputField.inputValue();
  419 |       expect(value.length).toBe(200);
  420 |     }
  421 |   });
  422 | 
  423 |   test('TC6.6 - Save button is present and clickable', async ({ page }) => {
  424 |     const saveBtn = page.locator('button').filter({ hasText: /บันทึก/i });
  425 |     await expect(saveBtn.first()).toBeVisible({ timeout: 10000 });
  426 |     await expect(saveBtn.first()).toBeEnabled();
  427 |   });
  428 | });
  429 | 
  430 | // ─────────────────────────────────────────────────────────
  431 | // Module 7: Top Navigation (Preview Mode & Save/Publish)
  432 | // ─────────────────────────────────────────────────────────
  433 | test.describe('Module 7: Top Navigation (Preview Mode & Save/Publish)', () => {
  434 | 
  435 |   test.beforeEach(async ({ page }) => {
  436 |     await loginAsAdmin(page);
  437 |     await goToTab(page, 'ออกแบบหน้าเว็บ');
  438 |   });
  439 | 
  440 |   test('TC7.1 - Click Mobile icon → Live Preview shows mobile viewport frame', async ({ page }) => {
  441 |     // Find the Mobile toggle button in the preview header
  442 |     const mobileBtn = page.locator('button').filter({ hasText: 'Mobile' });
  443 |     await expect(mobileBtn.first()).toBeVisible({ timeout: 10000 });
  444 |     await mobileBtn.first().click();
  445 |     await page.waitForTimeout(1500);
  446 | 
  447 |     // Verify mobile frame container appears (rounded phone bezel)
  448 |     const mobileFrame = page.locator('[class*="rounded-[2.5rem]"]');
  449 |     if (await mobileFrame.count() > 0) {
  450 |       await expect(mobileFrame.first()).toBeVisible();
  451 |     }
  452 | 
  453 |     // Switch back to desktop
  454 |     const desktopBtn = page.locator('button').filter({ hasText: 'Desktop' });
  455 |     if (await desktopBtn.count() > 0) {
  456 |       await desktopBtn.first().click();
  457 |       await page.waitForTimeout(500);
  458 |     }
  459 |   });
  460 | 
  461 |   test('TC7.2 - Save Draft button stores data to localStorage', async ({ page }) => {
  462 |     const saveDraftBtn = page.locator('button').filter({ hasText: 'บันทึกร่าง' });
> 463 |     await expect(saveDraftBtn.first()).toBeVisible({ timeout: 10000 });
      |                                        ^ Error: expect(locator).toBeVisible() failed
  464 |     await saveDraftBtn.first().click();
  465 |     await page.waitForTimeout(1500);
  466 | 
  467 |     // Verify data was stored in localStorage
  468 |     const draftData = await page.evaluate(() => localStorage.getItem('preview_draft'));
  469 |     expect(draftData).not.toBeNull();
  470 | 
  471 |     // Parse and verify structure
  472 |     if (draftData) {
  473 |       const parsed = JSON.parse(draftData);
  474 |       expect(parsed).toHaveProperty('home');
  475 |       expect(parsed).toHaveProperty('theme');
  476 |     }
  477 |   });
  478 | 
  479 |   test('TC7.3 - Publish button triggers confirmation when changes exist', async ({ page }) => {
  480 |     // Make a change by switching template
  481 |     const playfulCard = page.locator('button', { hasText: 'สนุกสนาน' }).first();
  482 |     if (await playfulCard.isVisible()) {
  483 |       await playfulCard.click();
  484 |       await page.waitForTimeout(500);
  485 | 
  486 |       const confirmTemplateBtn = page.locator('button').filter({ hasText: /ยืนยัน|ตกลง/i });
  487 |       if (await confirmTemplateBtn.count() > 0) {
  488 |         await confirmTemplateBtn.first().click();
  489 |         await page.waitForTimeout(1000);
  490 |       }
  491 |     }
  492 | 
  493 |     // Now click publish button
  494 |     const publishBtn = page.locator('button').filter({ hasText: /เผยแพร่/ });
  495 |     if (await publishBtn.count() > 0 && await publishBtn.first().isEnabled()) {
  496 |       await publishBtn.first().click();
  497 |       await page.waitForTimeout(1000);
  498 | 
  499 |       // Confirmation modal should appear
  500 |       const confirmModal = page.locator('div[class*="fixed"]').filter({ hasText: /ยืนยัน|เผยแพร่/i });
  501 |       if (await confirmModal.count() > 0) {
  502 |         await expect(confirmModal.first()).toBeVisible();
  503 |       }
  504 |     }
  505 |   });
  506 | });
  507 | 
  508 | // ─────────────────────────────────────────────────────────
  509 | // Module: Admin Page Loading & Sidebar Navigation
  510 | // ─────────────────────────────────────────────────────────
  511 | test.describe('Admin Page Loading & Navigation', () => {
  512 | 
  513 |   test('TC-NAV.1 - Admin login page loads correctly', async ({ page }) => {
  514 |     await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  515 | 
  516 |     // Check login form elements
  517 |     const usernameInput = page.locator('input[type="text"]');
  518 |     const passwordInput = page.locator('input[type="password"]');
  519 |     const loginBtn = page.locator('button[type="submit"]');
  520 | 
  521 |     await expect(usernameInput).toBeVisible({ timeout: 10000 });
  522 |     await expect(passwordInput).toBeVisible();
  523 |     await expect(loginBtn).toBeVisible();
  524 | 
  525 |     // Check heading
  526 |     const heading = page.locator('h1', { hasText: 'Administrator' });
  527 |     await expect(heading).toBeVisible();
  528 |   });
  529 | 
  530 |   test('TC-NAV.2 - Admin page loads with sidebar after login', async ({ page }) => {
  531 |     await loginAsAdmin(page);
  532 | 
  533 |     // Check sidebar is visible
  534 |     const sidebar = page.locator('aside');
  535 |     await expect(sidebar).toBeVisible({ timeout: 10000 });
  536 | 
  537 |     // Check all menu items exist
  538 |     const menuItems = ['ภาพรวม', 'ตั้งค่าทั่วไป', 'จัดการผู้สมัคร', 'ออกแบบหน้าเว็บ', 'ตั้งค่าระบบ'];
  539 |     for (const item of menuItems) {
  540 |       const btn = page.locator('button').filter({ hasText: item });
  541 |       await expect(btn.first()).toBeVisible({ timeout: 10000 });
  542 |     }
  543 |   });
  544 | 
  545 |   test('TC-NAV.3 - All sidebar tabs switch content without errors', async ({ page }) => {
  546 |     await loginAsAdmin(page);
  547 | 
  548 |     const menuItems = ['ตั้งค่าทั่วไป', 'จัดการผู้สมัคร', 'ออกแบบหน้าเว็บ', 'ตั้งค่าระบบ', 'ภาพรวม'];
  549 | 
  550 |     for (const item of menuItems) {
  551 |       const btn = page.locator('nav button, aside button').filter({ hasText: item });
  552 |       await btn.first().click();
  553 |       await page.waitForTimeout(2000);
  554 | 
  555 |       // Verify no crash
  556 |       const errorBoundary = page.locator('text=Something went wrong');
  557 |       await expect(errorBoundary).toHaveCount(0);
  558 | 
  559 |       // Verify content area is visible
  560 |       const mainContent = page.locator('main');
  561 |       await expect(mainContent).toBeVisible();
  562 |     }
  563 |   });
```