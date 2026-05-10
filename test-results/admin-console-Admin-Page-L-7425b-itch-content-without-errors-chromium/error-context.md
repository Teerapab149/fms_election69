# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-console.spec.js >> Admin Page Loading & Navigation >> TC-NAV.3 - All sidebar tabs switch content without errors
- Location: e2e\admin-console.spec.js:545:3

# Error details

```
TimeoutError: locator.fill: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[type="text"]')

```

# Page snapshot

```yaml
- generic [active]:
  - alert [ref=e1]
  - dialog [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading "Build Error" [level=1] [ref=e7]
        - paragraph [ref=e8]: Failed to compile
        - generic [ref=e9]:
          - text: Next.js (14.2.35) is outdated
          - link "(learn more)" [ref=e11] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
      - generic [ref=e12]:
        - generic [ref=e13]:
          - link "./src/components/admin/editor/PropertyPanel.js" [ref=e14] [cursor=pointer]:
            - text: ./src/components/admin/editor/PropertyPanel.js
            - img [ref=e15]
          - generic [ref=e19]:
            - generic [ref=e20]: "Error:"
            - text: x
            - generic [ref=e21]: Expression expected ,-[
            - text: E:\fms-election\fms_election69\src\components\admin\editor\PropertyPanel.js
            - generic [ref=e22]: :218:1]
            - text: "218"
            - generic [ref=e23]: "| </div>"
            - text: "219"
            - generic [ref=e24]: "| );"
            - text: "220"
            - generic [ref=e25]: "| }"
            - text: "221"
            - generic [ref=e26]: "| case \"button\": return <ButtonControls config={config} onChange={handleChange} boundInput={boundInput} />; :"
            - generic [ref=e27]: ^^^^
            - text: "222"
            - generic [ref=e28]: "| case \"card\": return <CardControls config={config} onChange={handleChange} />;"
            - text: "223"
            - generic [ref=e29]: "| case \"image\": return <ImageControls config={config} onChange={handleChange} />;"
            - text: "224"
            - generic [ref=e30]: "| case \"toggle\": return <ToggleControls config={config} onChange={handleChange} />; `---- Caused by: Syntax Error Import trace for requested module:"
            - link "./src/components/admin/editor/PropertyPanel.js" [ref=e31] [cursor=pointer]:
              - text: ./src/components/admin/editor/PropertyPanel.js
              - img [ref=e32]
            - link "./src/components/admin/PageDesignTab.js" [ref=e36] [cursor=pointer]:
              - text: ./src/components/admin/PageDesignTab.js
              - img [ref=e37]
            - link "./src/app/admin/page.js" [ref=e41] [cursor=pointer]:
              - text: ./src/app/admin/page.js
              - img [ref=e42]
        - contentinfo [ref=e46]:
          - paragraph [ref=e47]: This error occurred during the build process and can only be dismissed by fixing the error.
```

# Test source

```ts
  1   | // @ts-check
  2   | const { test, expect } = require('@playwright/test');
  3   | 
  4   | const BASE = '/fms-ovs/admin';
  5   | const LOGIN_URL = '/fms-ovs/admin/login';
  6   | 
  7   | // Admin credentials from seed data
  8   | const ADMIN_USERNAME = '6610510149';
  9   | const ADMIN_PASSWORD = '6610510149@email.psu.ac.th+ADMIN_FMS2026_2026_secret_9QpZxL';
  10  | 
  11  | /**
  12  |  * Helper: login to admin panel through the login page
  13  |  */
  14  | async function loginAsAdmin(page) {
  15  |   await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  16  |   await page.waitForTimeout(1000);
  17  | 
  18  |   // Fill in login form
  19  |   const usernameInput = page.locator('input[type="text"]');
  20  |   const passwordInput = page.locator('input[type="password"]');
  21  | 
> 22  |   await usernameInput.fill(ADMIN_USERNAME);
      |                       ^ TimeoutError: locator.fill: Timeout 10000ms exceeded.
  23  |   await passwordInput.fill(ADMIN_PASSWORD);
  24  | 
  25  |   // Click login button
  26  |   const loginBtn = page.locator('button[type="submit"]');
  27  |   await loginBtn.click();
  28  | 
  29  |   // Wait for redirect to admin page
  30  |   await page.waitForURL('**/admin', { timeout: 15000 }).catch(() => {});
  31  |   await page.waitForTimeout(2000);
  32  | }
  33  | 
  34  | /**
  35  |  * Helper: navigate to a specific admin tab
  36  |  */
  37  | async function goToTab(page, tabName) {
  38  |   const btn = page.locator('nav button, aside button').filter({ hasText: tabName });
  39  |   if (await btn.count() > 0) {
  40  |     await btn.first().click();
  41  |     await page.waitForTimeout(2000);
  42  |   }
  43  | }
  44  | 
  45  | // ─────────────────────────────────────────────────────────
  46  | // Module 1: Template Selection (เลือก Template)
  47  | // ─────────────────────────────────────────────────────────
  48  | test.describe('Module 1: Template Selection', () => {
  49  | 
  50  |   test.beforeEach(async ({ page }) => {
  51  |     await loginAsAdmin(page);
  52  |     await goToTab(page, 'ออกแบบหน้าเว็บ');
  53  |   });
  54  | 
  55  |   test('TC1.1 - Click "สนุกสนาน" (Playful) template shows confirmation modal', async ({ page }) => {
  56  |     // Look for the Playful template card
  57  |     const playfulCard = page.locator('button', { hasText: 'สนุกสนาน' }).first();
  58  |     await expect(playfulCard).toBeVisible({ timeout: 10000 });
  59  |     await playfulCard.click();
  60  |     await page.waitForTimeout(1000);
  61  | 
  62  |     // Wait for confirmation modal to appear
  63  |     // ConfirmModal component is used in PageDesignTab for template application
  64  |     const modal = page.locator('div[class*="fixed"]').filter({ hasText: /ยืนยัน|ต้องการ|template/i });
  65  |     await expect(modal.first()).toBeVisible({ timeout: 5000 });
  66  |   });
  67  | 
  68  |   test('TC1.2 - Click "Confirm" in template modal → Live Preview updates to Playful design', async ({ page }) => {
  69  |     // Click Playful template
  70  |     const playfulCard = page.locator('button', { hasText: 'สนุกสนาน' }).first();
  71  |     await playfulCard.click();
  72  |     await page.waitForTimeout(1000);
  73  | 
  74  |     // Find and click confirm button in modal
  75  |     const confirmBtn = page.locator('button').filter({ hasText: /ยืนยัน|ตกลง/i });
  76  |     await expect(confirmBtn.first()).toBeVisible({ timeout: 5000 });
  77  |     await confirmBtn.first().click();
  78  |     await page.waitForTimeout(1500);
  79  | 
  80  |     // Check that the active preset indicator now says "สนุกสนาน"
  81  |     const activeIndicator = page.locator('span[class*="rounded-full"]').filter({ hasText: /สนุกสนาน/ });
  82  |     await expect(activeIndicator.first()).toBeVisible({ timeout: 5000 });
  83  |   });
  84  | 
  85  |   test('TC1.3 - Click "Cancel" in template modal → active template remains unchanged', async ({ page }) => {
  86  |     // Get current active template text
  87  |     const activePresetBadge = page.locator('span[class*="rounded-full"]').filter({ hasText: /●/ });
  88  |     const initialText = await activePresetBadge.first().textContent({ timeout: 5000 });
  89  | 
  90  |     // Click a different template  
  91  |     const playfulCard = page.locator('button', { hasText: 'โมเดิร์นดาร์ก' }).first();
  92  |     await playfulCard.click();
  93  |     await page.waitForTimeout(1000);
  94  | 
  95  |     // Click cancel button in modal
  96  |     const cancelBtn = page.locator('button').filter({ hasText: /ยกเลิก|cancel/i });
  97  |     if (await cancelBtn.count() > 0) {
  98  |       await cancelBtn.first().click();
  99  |       await page.waitForTimeout(500);
  100 | 
  101 |       // Verify the active template remains unchanged
  102 |       const finalText = await activePresetBadge.first().textContent();
  103 |       expect(finalText).toBe(initialText);
  104 |     }
  105 |   });
  106 | 
  107 |   test('TC1.4 - [Edge Case] Rapid template clicking - modals do not stack/overlap', async ({ page }) => {
  108 |     const templates = ['คลาสสิก', 'โมเดิร์นดาร์ก', 'สนุกสนาน', 'มินิมอล'];
  109 | 
  110 |     for (const name of templates) {
  111 |       const card = page.locator('button', { hasText: name }).first();
  112 |       if (await card.isVisible()) {
  113 |         await card.click();
  114 |         await page.waitForTimeout(200);
  115 |         // Try to dismiss modal quickly if it appears
  116 |         const cancelBtn = page.locator('button').filter({ hasText: /ยกเลิก/i });
  117 |         if (await cancelBtn.count() > 0 && await cancelBtn.first().isVisible()) {
  118 |           await cancelBtn.first().click();
  119 |           await page.waitForTimeout(100);
  120 |         }
  121 |       }
  122 |     }
```