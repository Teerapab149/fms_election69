📋 TEST_PLAN.md: SAMO 50 Admin Console
🎯 Target: Verify the UI/UX accuracy, data flow, and state synchronization of the Admin Editor.
🔍 Scope: Admin Console (Sidebar navigation, Center Editor Panel, and Right Live Preview).
🕳️ Depth: Feature + Edge Case + UI State Syncing.
🛠️ Format: Hybrid (Manual Checklist + Claude Code Automated Prompts).

🐛 Bug Report Template
(Copy this format when opening an issue on GitHub/GitLab)

Markdown
**Bug Title:** [Module] Brief description (e.g., [Live Preview] Color does not update on rapid clicks)
**Steps to Reproduce:**
1. Go to page...
2. Click on...
3. Enter value...
**Expected Result:** ...
**Actual Result:** ...
**Environment:** OS / Browser / Viewport (Desktop/Mobile)
**📸 Screenshot/Video:** [Attach link or file]
🤖 Claude Code Base Prompt
(Provide this instruction to Claude Code or your AI Assistant before running automated tests)

"You are a QA Engineer. Your goal is to run Automated Tests (E2E) using Playwright/Cypress based on this TEST_PLAN.md. Run the command npm run dev to start the local server, then write and execute test scripts for the specified modules. If the UI does not match the Expected Result or if Console Errors occur, report them using the provided 'Bug Report Template'."

**Login credentials:**
admin password: 6610510149@email.psu.ac.th+ADMIN_FMS2026_2026_secret_9QpZxL
admin user: 6610510149

🧪 Modules Test Cases
1. Template Selection (เลือก Template)
Based on the top section offering 4 presets: Classic, Vibrant, Playful, Minimal.

[ ] Feature: Click on the "Playful" (สนุกสนาน) template. The system should display a confirmation modal ("Do you want to use this template?").

[ ] Feature: Click "Confirm" in the modal -> The Live Preview on the right must instantly switch to the new design.

[ ] Feature: Click "Cancel" in the modal -> The system must revert to the previously active template.

[ ] Edge Case: ⚠️ [Human Eye] Rapidly click different templates 3-4 times. Verify that modals do not stack/overlap and the app does not crash.

🤖 Claude Code Prompt: Write a test to click the "โดดเด่นสดใส" template, wait for the confirmation modal, click "ยกเลิก" (Cancel), and assert that the current active template remains unchanged.

2. Page Navigation (เลือกหน้าเว็บที่ต้องการแก้ไข)
Testing tab switching between Home, Candidates, Voting, and Success pages.

[ ] Feature: Click the "Candidates" (รายชื่อผู้สมัคร) tab -> Both the center Section List and the Live Preview must update to display the corresponding page data.

[ ] Feature: ⚠️ [Human Eye] Change a color value in the "Home" tab without saving -> Switch to the "Voting" tab -> Switch back to the "Home" tab. The unsaved color modification must persist in the state.

[ ] Edge Case: Verify loading states during tab switching. If the data takes time to fetch, a loading spinner/skeleton must be visible instead of a blank white screen.

3. Main Sections (Drag & Drop & Visibility)
Testing the center control panel (e.g., Hero, Stats, Candidates).

[ ] Feature: Drag and drop the Stats section to the top of the list -> The Live Preview must reflect this reordering immediately.

[ ] Feature: Toggle the visibility switch OFF for the Vote CTA section -> The section must disappear from the Live Preview.

[ ] Edge Case: ⚠️ [Human Eye] Toggle OFF all available sections. The Live Preview should display an empty canvas or a fallback placeholder without crashing the application.

🤖 Claude Code Prompt: Write a Cypress test to perform a drag-and-drop action, moving the second list item in the "Sections" panel to the first position, and verify the DOM order in the preview updates correctly.

4. Element & Style Editing (การตั้งค่าระดับ Element)
Testing deep configuration, specifically addressing the rapid-click sync issue seen in the video.

[ ] Feature: Expand an element's settings -> Enter a valid Hex Code (e.g., #FF0000) -> The color in the Live Preview must update accordingly.

[ ] Feature: Use the mouse to drag around the Color Picker -> The Live Preview color should update in real-time (or with a smooth debounce).

[ ] Edge Case (Stress Test): ⚠️ [Human Eye] Enter an invalid Hex Code or leave the input completely empty. The UI must not break; it should fallback to a default color or display a validation error state (red border).

[ ] Edge Case (Bug Reproduction): Rapidly toggle the ON/OFF switches inside sub-element settings. Observe the Live Preview to ensure it does not freeze or lose synchronization (State Sync check).

5. Stateful Elements (สถานะของส่วนประกอบ)
Testing elements with conditional rendering (e.g., Voting button in Starts In vs. Closed states).

[ ] Feature: Select the Starts In state tab -> Edit the text/color -> Live Preview updates to show the pre-election appearance.

[ ] Feature: Select the Closed state tab -> Live Preview must mock the disabled/closed appearance of the button.

[ ] Edge Case: Rapidly switch between Starts In and Closed tabs. The UI must render the correct state instantly without overlapping text or ghosting elements.

6. Global Settings (ตั้งค่าทั่วไป)
Testing the global form fields seen at the end of the video (Project Name, Academic Year).

[ ] Feature: Change the "Project Name" (ชื่อโปรเจกต์) from SAMO 50 to something else. Check if the Header/Logo area in the Live Preview updates automatically.

[ ] Feature: Enter the academic year 2570 into the input field -> System accepts and binds the data correctly.

[ ] Edge Case: ⚠️ [Human Eye] Insert special characters or emojis (🚀) into the Thai Organization Name field. The system should either accept it gracefully or trigger a proper validation warning.

[ ] Edge Case: Paste a 200-line string into the Organization Name field. Ensure the Admin UI layout does not break (overflow check).

7. Top Navigation (Preview Mode & Save/Publish)
Testing viewing modes and data persistence actions.

[ ] Feature: Click the Mobile icon -> The Live Preview container scales down to a mobile viewport width. Ensure responsive design holds up.

[ ] Feature: Click Save Draft (บันทึกร่าง) -> A success Toast/Snackbar notification appears confirming the save.

[ ] Feature: Click Publish (เผยแพร่) -> The system updates the live status (pushing config to the client-facing app).

[ ] Edge Case: ⚠️ [Human Eye] Make unsaved changes and attempt to close or refresh the browser tab. The browser's native beforeunload alert must pop up warning the user about unsaved changes.