# SAMO 50 Admin Console - Automated Test Report

## Overview
**Test Framework:** Playwright (Chromium)
**Total Tests:** 26
**Passed:** 15
**Failed:** 11

---

## ✅ Passed Tests

- **TC1.1:** Click "สนุกสนาน" (Playful) template shows confirmation modal
- **TC1.2:** Click "Confirm" in template modal → Live Preview updates to Playful design
- **TC1.3:** Click "Cancel" in template modal → active template remains unchanged
- **TC2.1:** Click "รายชื่อผู้สมัคร" (Candidates) tab → panel and preview update
- **TC3.1:** Section list is displayed with reorder and visibility controls
- **TC4.1:** Color/theme section is visible in the template area
- **TC5.1:** Live Preview renders with stateful content (countdown/status)
- **TC6.1:** Global config tab loads with form fields
- **TC6.2:** Change election name → input accepts and holds the value
- **TC6.3:** Enter academic year 2570 → system accepts numeric value
- **TC6.4:** [Edge Case] Special characters and emojis in organization name
- **TC6.5:** [Edge Case] Long text (200 chars) in organization name → layout does not break
- **TC6.6:** Save button is present and clickable
- **TC7.3:** Publish button triggers confirmation when changes exist
- **TC-NAV.1:** Admin login page loads correctly

---

## ❌ Failed Tests (Bug Reports)

**Bug Title:** [Template Selection] Rapid template clicking - modals do not stack/overlap (TC1.4)
**Steps to Reproduce:**
1. Log in to the Admin Dashboard and go to 'ออกแบบหน้าเว็บ'.
2. Rapidly click between multiple template cards ('คลาสสิก', 'โมเดิร์นดาร์ก', 'สนุกสนาน', 'มินิมอล').
**Expected Result:** Only a single confirmation modal should be visible at any time, or they should close/replace each other gracefully without stacking. UI should not lock up or crash.
**Actual Result:** The test execution timed out while asserting modal behavior under rapid clicking conditions, indicating overlapping or unhandled modal states that prevented stable interaction.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC1.4`.

---

**Bug Title:** [Page Navigation] Loading states during tab switching - no blank white screen (TC2.2)
**Steps to Reproduce:**
1. Navigate to 'ออกแบบหน้าเว็บ'.
2. Switch rapidly between the editable pages: 'หน้าลงคะแนน', 'ผลคะแนน', 'รายชื่อผู้สมัคร', 'หน้าหลัก'.
**Expected Result:** A proper loading spinner or skeleton should display. The screen should not go entirely blank (white screen of death).
**Actual Result:** The test timed out verifying the visibility of the main content during transition, suggesting that the DOM briefly vanished or the loading state took too long to resolve the elements.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC2.2`.

---

**Bug Title:** [Main Sections] Toggle visibility switch exists and is clickable (TC3.2)
**Steps to Reproduce:**
1. Navigate to 'ออกแบบหน้าเว็บ'.
2. In the Section Manager on the 'หน้าหลัก' page, click the visibility toggle (eye icon) for a section.
**Expected Result:** The section should toggle its visibility status both in the settings panel and in the Live Preview.
**Actual Result:** Playwright reported a timeout trying to click the visibility toggle, indicating the toggle button might be unresponsive, incorrectly positioned, or blocked by another element.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC3.2`.

---

**Bug Title:** [Main Sections] Page does not crash when interacting with sections (TC3.3)
**Steps to Reproduce:**
1. Go to 'ออกแบบหน้าเว็บ' and load 'หน้าหลัก'.
2. Interact with the section elements (e.g., toggling or reordering).
**Expected Result:** The admin editor should remain stable and functional without throwing React error boundaries.
**Actual Result:** Test failed when asserting stability, indicating the UI crashed or the DOM became unstable after section interactions.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC3.3`.

---

**Bug Title:** [Element & Style Editing] UI does not crash after template interactions (TC4.2)
**Steps to Reproduce:**
1. Go to 'ออกแบบหน้าเว็บ'.
2. Apply a new template ('มินิมอล') and interact with it.
**Expected Result:** The UI should gracefully render the new template and allow further edits.
**Actual Result:** UI crashed or timed out rendering the selected template, violating the stability check.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC4.2`.

---

**Bug Title:** [Stateful Elements] State tabs can be switched without crash (TC5.2)
**Steps to Reproduce:**
1. Navigate to the editor for an element that contains states (e.g., 'Starts In', 'Closed').
2. Toggle between these states in the editor.
**Expected Result:** The Live Preview should reflect the new state instantly without crashing.
**Actual Result:** The test assertion for stable UI failed after state tab interactions.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC5.2`.

---

**Bug Title:** [Top Navigation] Click Mobile icon → Live Preview shows mobile viewport frame (TC7.1)
**Steps to Reproduce:**
1. In the 'ออกแบบหน้าเว็บ' tab, locate the Preview header.
2. Click the 'Mobile' button.
**Expected Result:** The Live Preview container should scale down to a mobile viewport width.
**Actual Result:** Test failed while asserting the visibility of the mobile viewport container (timeout exceeded), indicating the responsive mode frame is missing or not functioning.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC7.1`.

---

**Bug Title:** [Top Navigation] Save Draft button stores data to localStorage (TC7.2)
**Steps to Reproduce:**
1. Navigate to 'ออกแบบหน้าเว็บ'.
2. Click the 'บันทึกร่าง' (Save Draft) button.
**Expected Result:** Data should be stored to `localStorage` under `preview_draft`, and a success toast should appear.
**Actual Result:** The test timed out checking for the `localStorage` key and success toast.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC7.2`.

---

**Bug Title:** [Admin Navigation] Admin page loads with sidebar after login (TC-NAV.2)
**Steps to Reproduce:**
1. Log in to the Admin Dashboard via `/fms-ovs/admin/login`.
2. Observe the sidebar load on `/fms-ovs/admin`.
**Expected Result:** The admin dashboard and sidebar should load and be interactive.
**Actual Result:** Playwright reported `TimeoutError: locator.click: Timeout 10000ms exceeded. <nextjs-portal></nextjs-portal> intercepts pointer events`. A portal (likely a loading overlay, spinner, or toast) is blocking interactions with the admin page, causing it to be essentially frozen for users.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC-NAV.2`.

---

**Bug Title:** [Admin Navigation] All sidebar tabs switch content without errors (TC-NAV.3)
**Steps to Reproduce:**
1. Log in to the Admin Dashboard.
2. Click through the various tabs in the sidebar ('ตั้งค่าทั่วไป', 'จัดการผู้สมัคร', 'ออกแบบหน้าเว็บ', 'ตั้งค่าระบบ', 'ภาพรวม').
**Expected Result:** Content should switch accurately without errors or timeouts.
**Actual Result:** The test timed out trying to input login credentials because of similar event interception issues preventing the test from even starting correctly in this suite.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC-NAV.3`.

---

**Bug Title:** [Admin Navigation] Console errors check on admin page (TC-NAV.4)
**Steps to Reproduce:**
1. Log in to the Admin Dashboard.
2. Wait for page load and observe browser console.
**Expected Result:** There should be no critical errors, React hydration errors, or unhandled promise rejections.
**Actual Result:** Test failed to execute fully due to login interaction being blocked by overlapping DOM elements.
**Environment:** Windows / Playwright (Chromium) / Desktop (1440x900)
**📸 Screenshot/Video:** Refer to Playwright test trace `TC-NAV.4`.
