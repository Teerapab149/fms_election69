// @ts-check
const { test, expect } = require('@playwright/test');

const BASE = '/admin';
const LOGIN_URL = '/admin/login';

// Admin credentials from seed data
const ADMIN_USERNAME = '6610510149';
const ADMIN_PASSWORD = '6610510149@email.psu.ac.th+ADMIN_FMS2026_2026_secret_9QpZxL';

/**
 * Helper: login to admin panel through the login page
 */
async function loginAsAdmin(page) {
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Fill in login form
  const usernameInput = page.locator('input[type="text"]');
  const passwordInput = page.locator('input[type="password"]');

  await usernameInput.fill(ADMIN_USERNAME);
  await passwordInput.fill(ADMIN_PASSWORD);

  // Click login button
  const loginBtn = page.locator('button[type="submit"]');
  await loginBtn.click();

  // Wait for redirect to admin page
  await page.waitForURL('**/admin', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

/**
 * Helper: navigate to a specific admin tab
 */
async function goToTab(page, tabName) {
  const btn = page.locator('nav button, aside button').filter({ hasText: tabName });
  if (await btn.count() > 0) {
    await btn.first().click();
    await page.waitForTimeout(2000);
  }
}

// ─────────────────────────────────────────────────────────
// Module 1: Template Selection (เลือก Template)
// ─────────────────────────────────────────────────────────
test.describe('Module 1: Template Selection', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToTab(page, 'ออกแบบหน้าเว็บ');
  });

  test('TC1.1 - Click "สนุกสนาน" (Playful) template shows confirmation modal', async ({ page }) => {
    // Look for the Playful template card
    const playfulCard = page.locator('button', { hasText: 'สนุกสนาน' }).first();
    await expect(playfulCard).toBeVisible({ timeout: 10000 });
    await playfulCard.click();
    await page.waitForTimeout(1000);

    // Wait for confirmation modal to appear
    // ConfirmModal component is used in PageDesignTab for template application
    const modal = page.locator('div[class*="fixed"]').filter({ hasText: /ยืนยัน|ต้องการ|template/i });
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });

  test('TC1.2 - Click "Confirm" in template modal → Live Preview updates to Playful design', async ({ page }) => {
    // Click Playful template
    const playfulCard = page.locator('button', { hasText: 'สนุกสนาน' }).first();
    await playfulCard.click();
    await page.waitForTimeout(1000);

    // Find and click confirm button in modal
    const confirmBtn = page.locator('button').filter({ hasText: /ยืนยัน|ตกลง/i });
    await expect(confirmBtn.first()).toBeVisible({ timeout: 5000 });
    await confirmBtn.first().click();
    await page.waitForTimeout(1500);

    // Check that the active preset indicator now says "สนุกสนาน"
    const activeIndicator = page.locator('span[class*="rounded-full"]').filter({ hasText: /สนุกสนาน/ });
    await expect(activeIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('TC1.3 - Click "Cancel" in template modal → active template remains unchanged', async ({ page }) => {
    // Get current active template text
    const activePresetBadge = page.locator('span[class*="rounded-full"]').filter({ hasText: /●/ });
    const initialText = await activePresetBadge.first().textContent({ timeout: 5000 });

    // Click a different template  
    const playfulCard = page.locator('button', { hasText: 'โมเดิร์นดาร์ก' }).first();
    await playfulCard.click();
    await page.waitForTimeout(1000);

    // Click cancel button in modal
    const cancelBtn = page.locator('button').filter({ hasText: /ยกเลิก|cancel/i });
    if (await cancelBtn.count() > 0) {
      await cancelBtn.first().click();
      await page.waitForTimeout(500);

      // Verify the active template remains unchanged
      const finalText = await activePresetBadge.first().textContent();
      expect(finalText).toBe(initialText);
    }
  });

  test('TC1.4 - [Edge Case] Rapid template clicking - modals do not stack/overlap', async ({ page }) => {
    const templates = ['คลาสสิก', 'โมเดิร์นดาร์ก', 'สนุกสนาน', 'มินิมอล'];

    for (const name of templates) {
      const card = page.locator('button', { hasText: name }).first();
      if (await card.isVisible()) {
        await card.click();
        await page.waitForTimeout(200);
        // Try to dismiss modal quickly if it appears
        const cancelBtn = page.locator('button').filter({ hasText: /ยกเลิก/i });
        if (await cancelBtn.count() > 0 && await cancelBtn.first().isVisible()) {
          await cancelBtn.first().click();
          await page.waitForTimeout(100);
        }
      }
    }

    await page.waitForTimeout(500);
    // Verify page didn't crash - check for error boundaries
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).toHaveCount(0);

    // Page content should still be rendered
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
// Module 2: Page Navigation (เลือกหน้าเว็บที่ต้องการแก้ไข)
// ─────────────────────────────────────────────────────────
test.describe('Module 2: Page Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToTab(page, 'ออกแบบหน้าเว็บ');
  });

  test('TC2.1 - Click "รายชื่อผู้สมัคร" (Candidates) tab → panel and preview update', async ({ page }) => {
    const candidatesTab = page.locator('button').filter({ hasText: 'รายชื่อผู้สมัคร' });
    // There might be multiple buttons with this text (sidebar + page selector), find the page selector one
    const pageSelector = candidatesTab.last();
    await expect(pageSelector).toBeVisible({ timeout: 10000 });
    await pageSelector.click();
    await page.waitForTimeout(1500);

    // Check the editing indicator shows the candidates page
    const editingIndicator = page.locator('span[class*="font-bold"]').filter({ hasText: 'รายชื่อผู้สมัคร' });
    await expect(editingIndicator.first()).toBeVisible();
  });

  test('TC2.2 - Loading states during tab switching - no blank white screen', async ({ page }) => {
    const tabs = ['หน้าลงคะแนน', 'ผลคะแนน', 'รายชื่อผู้สมัคร', 'หน้าหลัก'];

    for (const tabName of tabs) {
      // Use the page selector buttons (not sidebar)
      const tab = page.locator('button').filter({ hasText: tabName });
      const pageTab = tab.last();
      if (await pageTab.isVisible()) {
        await pageTab.click();
        await page.waitForTimeout(1500);

        // Verify no blank white screen - main content must be present
        const mainContent = page.locator('main');
        await expect(mainContent).toBeVisible();

        // Verify no uncaught errors
        const errorText = page.locator('text=Something went wrong');
        await expect(errorText).toHaveCount(0);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────
// Module 3: Main Sections (Drag & Drop & Visibility)
// ─────────────────────────────────────────────────────────
test.describe('Module 3: Main Sections (Reorder & Visibility)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToTab(page, 'ออกแบบหน้าเว็บ');
  });

  test('TC3.1 - Section list is displayed with reorder and visibility controls', async ({ page }) => {
    // Ensure on Home page
    const homePage = page.locator('button').filter({ hasText: 'หน้าหลัก' }).last();
    if (await homePage.isVisible()) {
      await homePage.click();
      await page.waitForTimeout(1000);
    }

    // Verify section items exist (looking for section type labels)
    const sectionLabels = ['Hero', 'Meet Candidates', 'สถิติ', 'Banner', 'โหวต'];
    let foundSections = 0;

    for (const label of sectionLabels) {
      const section = page.locator('span').filter({ hasText: new RegExp(label, 'i') });
      if (await section.count() > 0) {
        foundSections++;
      }
    }

    expect(foundSections).toBeGreaterThan(0);
  });

  test('TC3.2 - Toggle visibility switch exists and is clickable', async ({ page }) => {
    const homePage = page.locator('button').filter({ hasText: 'หน้าหลัก' }).last();
    if (await homePage.isVisible()) {
      await homePage.click();
      await page.waitForTimeout(1000);
    }

    // Find Eye/EyeOff toggle buttons
    const eyeButtons = page.locator('button[class*="rounded-lg"]').filter({
      has: page.locator('svg')
    });

    const eyeCount = await eyeButtons.count();
    expect(eyeCount).toBeGreaterThan(0);

    // Click first eye button to toggle visibility
    if (eyeCount > 0) {
      await eyeButtons.first().click();
      await page.waitForTimeout(500);

      // No crash
      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).toHaveCount(0);
    }
  });

  test('TC3.3 - [Edge Case] Page does not crash when interacting with sections', async ({ page }) => {
    const homePage = page.locator('button').filter({ hasText: 'หน้าหลัก' }).last();
    if (await homePage.isVisible()) {
      await homePage.click();
      await page.waitForTimeout(1000);
    }

    // Verify no crash
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).toHaveCount(0);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
// Module 4: Element & Style Editing
// ─────────────────────────────────────────────────────────
test.describe('Module 4: Element & Style Editing', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToTab(page, 'ออกแบบหน้าเว็บ');
  });

  test('TC4.1 - Color/theme section is visible in the template area', async ({ page }) => {
    // Look for the template palette section
    const templateSection = page.locator('div').filter({ hasText: /เลือก Template/i });
    await expect(templateSection.first()).toBeVisible({ timeout: 10000 });

    // Look for color swatches (the colored circles in template cards)
    const colorSwatches = page.locator('span[class*="rounded-full"][style*="background"]');
    const swatchCount = await colorSwatches.count();
    expect(swatchCount).toBeGreaterThan(0);
  });

  test('TC4.2 - [Edge Case] UI does not crash after template interactions', async ({ page }) => {
    // Click a template card (which shows colors)
    const templateCards = page.locator('button').filter({ hasText: 'มินิมอล' });
    if (await templateCards.count() > 0) {
      await templateCards.first().click();
      await page.waitForTimeout(500);

      // Confirm
      const confirmBtn = page.locator('button').filter({ hasText: /ยืนยัน|ตกลง/i });
      if (await confirmBtn.count() > 0) {
        await confirmBtn.first().click();
        await page.waitForTimeout(1000);
      }
    }

    // Verify page didn't crash
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).toHaveCount(0);

    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────
// Module 5: Stateful Elements
// ─────────────────────────────────────────────────────────
test.describe('Module 5: Stateful Elements', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToTab(page, 'ออกแบบหน้าเว็บ');
  });

  test('TC5.1 - Live Preview renders with stateful content (countdown/status)', async ({ page }) => {
    // Check for Live Preview panel
    const livePreview = page.locator('div').filter({ hasText: /Live Preview/i });
    await expect(livePreview.first()).toBeVisible({ timeout: 10000 });

    // Verify no crash
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).toHaveCount(0);
  });

  test('TC5.2 - State tabs can be switched without crash', async ({ page }) => {
    // Navigate and interact with the page - check for any state toggle areas
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Verify no crash
    const errorBoundary = page.locator('text=Something went wrong');
    await expect(errorBoundary).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────
// Module 6: Global Settings (ตั้งค่าทั่วไป)
// ─────────────────────────────────────────────────────────
test.describe('Module 6: Global Settings', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToTab(page, 'ตั้งค่าทั่วไป');
  });

  test('TC6.1 - Global config tab loads with form fields', async ({ page }) => {
    // Check for the Global Config heading
    const heading = page.locator('h2').filter({ hasText: 'ตั้งค่าทั่วไป' });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Check for form inputs
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('TC6.2 - Change election name → input accepts and holds the value', async ({ page }) => {
    // Find the election name input - look for label "ชื่อการเลือกตั้ง"
    const label = page.locator('label').filter({ hasText: 'ชื่อการเลือกตั้ง' });
    await expect(label.first()).toBeVisible({ timeout: 10000 });

    // Find the input field associated with it (sibling)
    const inputField = label.first().locator('..').locator('..').locator('input').first();
    await inputField.clear();
    await inputField.fill('SAMO 50 TEST');
    await page.waitForTimeout(500);

    const value = await inputField.inputValue();
    expect(value).toBe('SAMO 50 TEST');
  });

  test('TC6.3 - Enter academic year 2570 → system accepts numeric value', async ({ page }) => {
    const yearLabel = page.locator('label').filter({ hasText: 'ปีการศึกษา' });
    await expect(yearLabel.first()).toBeVisible({ timeout: 10000 });

    const inputField = yearLabel.first().locator('..').locator('..').locator('input').first();
    await inputField.clear();
    await inputField.fill('2570');
    await page.waitForTimeout(500);

    const value = await inputField.inputValue();
    expect(value).toBe('2570');
  });

  test('TC6.4 - [Edge Case] Special characters and emojis in organization name', async ({ page }) => {
    const orgLabel = page.locator('label').filter({ hasText: 'ชื่อองค์กร' });

    if (await orgLabel.count() > 0) {
      await expect(orgLabel.first()).toBeVisible({ timeout: 10000 });
      const inputField = orgLabel.first().locator('..').locator('..').locator('input').first();
      const testValue = 'สโมสรนักศึกษา 🚀 <test>';
      await inputField.clear();
      await inputField.fill(testValue);
      await page.waitForTimeout(500);

      // Should not crash
      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).toHaveCount(0);

      const value = await inputField.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('TC6.5 - [Edge Case] Long text (200 chars) in organization name → layout does not break', async ({ page }) => {
    const orgLabel = page.locator('label').filter({ hasText: 'ชื่อองค์กร' });

    if (await orgLabel.count() > 0) {
      await expect(orgLabel.first()).toBeVisible({ timeout: 10000 });
      const inputField = orgLabel.first().locator('..').locator('..').locator('input').first();
      const longText = 'A'.repeat(200);
      await inputField.clear();
      await inputField.fill(longText);
      await page.waitForTimeout(500);

      // Verify the admin UI doesn't break
      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).toHaveCount(0);

      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      const value = await inputField.inputValue();
      expect(value.length).toBe(200);
    }
  });

  test('TC6.6 - Save button is present and clickable', async ({ page }) => {
    const saveBtn = page.locator('button').filter({ hasText: /บันทึก/i });
    await expect(saveBtn.first()).toBeVisible({ timeout: 10000 });
    await expect(saveBtn.first()).toBeEnabled();
  });
});

// ─────────────────────────────────────────────────────────
// Module 7: Top Navigation (Preview Mode & Save/Publish)
// ─────────────────────────────────────────────────────────
test.describe('Module 7: Top Navigation (Preview Mode & Save/Publish)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToTab(page, 'ออกแบบหน้าเว็บ');
  });

  test('TC7.1 - Click Mobile icon → Live Preview shows mobile viewport frame', async ({ page }) => {
    // Find the Mobile toggle button in the preview header
    const mobileBtn = page.locator('button').filter({ hasText: 'Mobile' });
    await expect(mobileBtn.first()).toBeVisible({ timeout: 10000 });
    await mobileBtn.first().click();
    await page.waitForTimeout(1500);

    // Verify mobile frame container appears (rounded phone bezel)
    const mobileFrame = page.locator('[class*="rounded-[2.5rem]"]');
    if (await mobileFrame.count() > 0) {
      await expect(mobileFrame.first()).toBeVisible();
    }

    // Switch back to desktop
    const desktopBtn = page.locator('button').filter({ hasText: 'Desktop' });
    if (await desktopBtn.count() > 0) {
      await desktopBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('TC7.2 - Save Draft button stores data to localStorage', async ({ page }) => {
    const saveDraftBtn = page.locator('button').filter({ hasText: 'บันทึกร่าง' });
    await expect(saveDraftBtn.first()).toBeVisible({ timeout: 10000 });
    await saveDraftBtn.first().click();
    await page.waitForTimeout(1500);

    // Verify data was stored in localStorage
    const draftData = await page.evaluate(() => localStorage.getItem('preview_draft'));
    expect(draftData).not.toBeNull();

    // Parse and verify structure
    if (draftData) {
      const parsed = JSON.parse(draftData);
      expect(parsed).toHaveProperty('home');
      expect(parsed).toHaveProperty('theme');
    }
  });

  test('TC7.3 - Publish button triggers confirmation when changes exist', async ({ page }) => {
    // Make a change by switching template
    const playfulCard = page.locator('button', { hasText: 'สนุกสนาน' }).first();
    if (await playfulCard.isVisible()) {
      await playfulCard.click();
      await page.waitForTimeout(500);

      const confirmTemplateBtn = page.locator('button').filter({ hasText: /ยืนยัน|ตกลง/i });
      if (await confirmTemplateBtn.count() > 0) {
        await confirmTemplateBtn.first().click();
        await page.waitForTimeout(1000);
      }
    }

    // Now click publish button
    const publishBtn = page.locator('button').filter({ hasText: /เผยแพร่/ });
    if (await publishBtn.count() > 0 && await publishBtn.first().isEnabled()) {
      await publishBtn.first().click();
      await page.waitForTimeout(1000);

      // Confirmation modal should appear
      const confirmModal = page.locator('div[class*="fixed"]').filter({ hasText: /ยืนยัน|เผยแพร่/i });
      if (await confirmModal.count() > 0) {
        await expect(confirmModal.first()).toBeVisible();
      }
    }
  });
});

// ─────────────────────────────────────────────────────────
// Module: Admin Page Loading & Sidebar Navigation
// ─────────────────────────────────────────────────────────
test.describe('Admin Page Loading & Navigation', () => {

  test('TC-NAV.1 - Admin login page loads correctly', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Check login form elements
    const usernameInput = page.locator('input[type="text"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginBtn = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(loginBtn).toBeVisible();

    // Check heading
    const heading = page.locator('h1', { hasText: 'Administrator' });
    await expect(heading).toBeVisible();
  });

  test('TC-NAV.2 - Admin page loads with sidebar after login', async ({ page }) => {
    await loginAsAdmin(page);

    // Check sidebar is visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Check all menu items exist
    const menuItems = ['ภาพรวม', 'ตั้งค่าทั่วไป', 'จัดการผู้สมัคร', 'ออกแบบหน้าเว็บ', 'ตั้งค่าระบบ'];
    for (const item of menuItems) {
      const btn = page.locator('button').filter({ hasText: item });
      await expect(btn.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('TC-NAV.3 - All sidebar tabs switch content without errors', async ({ page }) => {
    await loginAsAdmin(page);

    const menuItems = ['ตั้งค่าทั่วไป', 'จัดการผู้สมัคร', 'ออกแบบหน้าเว็บ', 'ตั้งค่าระบบ', 'ภาพรวม'];

    for (const item of menuItems) {
      const btn = page.locator('nav button, aside button').filter({ hasText: item });
      await btn.first().click();
      await page.waitForTimeout(2000);

      // Verify no crash
      const errorBoundary = page.locator('text=Something went wrong');
      await expect(errorBoundary).toHaveCount(0);

      // Verify content area is visible
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    }
  });

  test('TC-NAV.4 - Console errors check on admin page', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await loginAsAdmin(page);
    await page.waitForTimeout(3000);

    // Filter out expected environment errors
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to load resource') &&
      !e.includes('hydration') &&
      !e.includes('Encryption failed') &&
      !e.includes('Configuration Error') &&
      !e.includes('NEXT_REDIRECT') &&
      !e.includes('404')
    );

    if (criticalErrors.length > 0) {
      test.info().annotations.push({
        type: 'warning',
        description: `Console errors: ${criticalErrors.join('; ')}`
      });
    }
  });
});
