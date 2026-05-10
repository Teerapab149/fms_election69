# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-console.spec.js >> Module 2: Page Navigation >> TC2.2 - Loading states during tab switching - no blank white screen
- Location: e2e\admin-console.spec.js:158:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main')
Expected: visible
Error: strict mode violation: locator('main') resolved to 2 elements:
    1) <main class="flex-1 p-6 md:p-8 bg-gray-50">…</main> aka getByRole('main').filter({ hasText: 'เลือก Template' })
    2) <main class="flex-1 px-4 lg:px-8 py-6 lg:py-12 max-w-6xl w-full mx-auto">…</main> aka getByRole('main').filter({ hasText: 'เลือก Template' }).getByRole('main')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('main')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]: A
        - generic [ref=e6]:
          - heading "Admin Console" [level=1] [ref=e7]
          - paragraph [ref=e8]: FMS Election 2026
      - navigation [ref=e9]:
        - button "ภาพรวม" [ref=e10] [cursor=pointer]:
          - img [ref=e11]
          - text: ภาพรวม
        - button "ตั้งค่าทั่วไป" [ref=e13] [cursor=pointer]:
          - img [ref=e14]
          - text: ตั้งค่าทั่วไป
        - button "จัดการผู้สมัคร" [ref=e17] [cursor=pointer]:
          - img [ref=e18]
          - text: จัดการผู้สมัคร
        - button "ออกแบบหน้าเว็บ" [ref=e20] [cursor=pointer]:
          - img [ref=e21]
          - text: ออกแบบหน้าเว็บ
        - button "ตั้งค่าระบบ" [ref=e27] [cursor=pointer]:
          - img [ref=e28]
          - text: ตั้งค่าระบบ
      - button "Logout" [ref=e32] [cursor=pointer]:
        - img [ref=e33]
        - text: Logout
    - generic [ref=e35]:
      - banner [ref=e36]:
        - generic [ref=e38]:
          - paragraph [ref=e39]: Administrator
          - paragraph [ref=e40]: Online
      - main [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]:
              - generic [ref=e46]:
                - img [ref=e48]
                - generic [ref=e54]:
                  - heading "เลือก Template" [level=3] [ref=e55]:
                    - text: เลือก Template
                    - img [ref=e56]
                  - paragraph [ref=e59]: เลือกธีมสำเร็จรูป แล้วปรับแต่งเพิ่มเติมได้
              - generic [ref=e60]: ● คลาสสิก
            - generic [ref=e61]:
              - button "คลาสสิก Classic แบบทางการ สีม่วง/ขาว เหมาะกับการเลือกตั้งทั่วไป" [ref=e62] [cursor=pointer]:
                - img [ref=e64]
                - generic [ref=e69]: คลาสสิก
                - generic [ref=e70]: Classic
                - paragraph [ref=e71]: แบบทางการ สีม่วง/ขาว เหมาะกับการเลือกตั้งทั่วไป
              - button "โมเดิร์นดาร์ก Modern Dark พื้นหลังเข้ม สีสดตัดกัน เหมาะกับแคมเปญที่ดูทันสมัย" [ref=e72] [cursor=pointer]:
                - generic [ref=e76]: โมเดิร์นดาร์ก
                - generic [ref=e77]: Modern Dark
                - paragraph [ref=e78]: พื้นหลังเข้ม สีสดตัดกัน เหมาะกับแคมเปญที่ดูทันสมัย
              - button "สนุกสนาน Playful สีสันสดใส rounded มากขึ้น เหมาะกับบรรยากาศเลือกตั้งที่ fun" [ref=e79] [cursor=pointer]:
                - generic [ref=e83]: สนุกสนาน
                - generic [ref=e84]: Playful
                - paragraph [ref=e85]: สีสันสดใส rounded มากขึ้น เหมาะกับบรรยากาศเลือกตั้งที่ fun
              - button "มินิมอล Minimal ขาวสะอาด typography เด่น เรียบหรู ดูเป็นมืออาชีพ" [ref=e86] [cursor=pointer]:
                - generic [ref=e90]: มินิมอล
                - generic [ref=e91]: Minimal
                - paragraph [ref=e92]: ขาวสะอาด typography เด่น เรียบหรู ดูเป็นมืออาชีพ
          - generic [ref=e93]:
            - generic [ref=e94]:
              - img [ref=e96]
              - generic [ref=e99]:
                - heading "เลือกหน้าที่ต้องการแก้ไข" [level=3] [ref=e100]
                - paragraph [ref=e101]: คลิกหน้าเพื่อแก้ไข section และ layout ของหน้านั้น
            - generic [ref=e102]:
              - button "หน้าหลัก /" [ref=e103] [cursor=pointer]:
                - img [ref=e104]
                - generic [ref=e107]:
                  - generic [ref=e108]: หน้าหลัก
                  - generic [ref=e109]: /
              - button "หน้าลงคะแนน /vote" [ref=e110] [cursor=pointer]:
                - img [ref=e111]
                - generic [ref=e114]:
                  - generic [ref=e115]: หน้าลงคะแนน
                  - generic [ref=e116]: /vote
              - button "ผลคะแนน /results" [active] [ref=e117] [cursor=pointer]:
                - img [ref=e118]
                - generic [ref=e120]:
                  - generic [ref=e121]: ผลคะแนน
                  - generic [ref=e122]: /results
              - button "รายชื่อผู้สมัคร /candidates" [ref=e123] [cursor=pointer]:
                - img [ref=e124]
                - generic [ref=e129]:
                  - generic [ref=e130]: รายชื่อผู้สมัคร
                  - generic [ref=e131]: /candidates
              - button "หน้าพรรค /party" [ref=e132] [cursor=pointer]:
                - img [ref=e133]
                - generic [ref=e139]:
                  - generic [ref=e140]: หน้าพรรค
                  - generic [ref=e141]: /party
              - button "โหวตสำเร็จ /success" [ref=e142] [cursor=pointer]:
                - img [ref=e143]
                - generic [ref=e146]:
                  - generic [ref=e147]: โหวตสำเร็จ
                  - generic [ref=e148]: /success
          - generic [ref=e149]:
            - generic [ref=e150]:
              - img [ref=e151]
              - generic [ref=e153]: "กำลังแก้ไข: ผลคะแนน"
            - generic [ref=e154]:
              - button "บันทึกร่าง" [ref=e155] [cursor=pointer]:
                - img [ref=e156]
                - text: บันทึกร่าง
              - button "เผยแพร่จริง" [disabled] [ref=e161]:
                - img [ref=e162]
                - text: เผยแพร่จริง
          - generic [ref=e165]:
            - generic [ref=e167]:
              - generic [ref=e168]:
                - generic [ref=e169]: โหมดจำลอง
                - generic [ref=e170]:
                  - button "หลายพรรค" [ref=e171] [cursor=pointer]
                  - button "พรรคเดียว" [ref=e172] [cursor=pointer]
              - generic [ref=e173]:
                - generic [ref=e174]:
                  - img [ref=e176]
                  - generic [ref=e178]:
                    - heading "Sections ของ ผลคะแนน" [level=3] [ref=e179]
                    - paragraph [ref=e180]: แสดงผลการลงคะแนนเสียงแบบ Real-time
                - generic [ref=e181]:
                  - generic [ref=e183]:
                    - generic [ref=e184]:
                      - button [disabled] [ref=e185]:
                        - img [ref=e186]
                      - button [ref=e188] [cursor=pointer]:
                        - img [ref=e189]
                    - generic [ref=e191]:
                      - img [ref=e193]
                      - generic [ref=e198]:
                        - generic [ref=e199]: Header
                        - text: header
                    - button [ref=e200] [cursor=pointer]:
                      - img [ref=e201]
                  - generic [ref=e205]:
                    - generic [ref=e206]:
                      - button [ref=e207] [cursor=pointer]:
                        - img [ref=e208]
                      - button [ref=e210] [cursor=pointer]:
                        - img [ref=e211]
                    - generic [ref=e213]:
                      - img [ref=e215]
                      - generic [ref=e220]:
                        - generic [ref=e221]: กราฟแสดงผล
                        - text: chartSection
                    - button [ref=e222] [cursor=pointer]:
                      - img [ref=e223]
                  - generic [ref=e227]:
                    - generic [ref=e228]:
                      - button [ref=e229] [cursor=pointer]:
                        - img [ref=e230]
                      - button [ref=e232] [cursor=pointer]:
                        - img [ref=e233]
                    - generic [ref=e235]:
                      - img [ref=e237]
                      - generic [ref=e242]:
                        - generic [ref=e243]: การ์ดผู้สมัคร
                        - text: candidateCards
                    - button [ref=e244] [cursor=pointer]:
                      - img [ref=e245]
                  - generic [ref=e249]:
                    - generic [ref=e250]:
                      - button [ref=e251] [cursor=pointer]:
                        - img [ref=e252]
                      - button [disabled] [ref=e254]:
                        - img [ref=e255]
                    - generic [ref=e257]:
                      - img [ref=e259]
                      - generic [ref=e264]:
                        - generic [ref=e265]: Demographics
                        - text: demographics
                    - button [ref=e266] [cursor=pointer]:
                      - img [ref=e267]
            - generic [ref=e271]:
              - generic [ref=e272]:
                - generic [ref=e273]:
                  - img [ref=e274]
                  - generic [ref=e277]: Live Preview
                  - generic [ref=e278]: · ผลคะแนน
                - generic [ref=e279]:
                  - generic [ref=e280]:
                    - button "Desktop" [ref=e281] [cursor=pointer]:
                      - img [ref=e282]
                      - text: Desktop
                    - button "Mobile" [ref=e284] [cursor=pointer]:
                      - img [ref=e285]
                      - text: Mobile
                  - button "เปิดในแท็บใหม่" [ref=e288] [cursor=pointer]:
                    - img [ref=e289]
              - generic [ref=e295]:
                - navigation [ref=e296]:
                  - generic [ref=e297]:
                    - link "FMS 50th FMS Name" [ref=e298] [cursor=pointer]:
                      - /url: /fms-ovs
                      - img "FMS 50th" [ref=e300]
                      - img "FMS Name" [ref=e302]
                    - generic [ref=e303]:
                      - generic [ref=e304]:
                        - link "หน้าแรก" [ref=e305] [cursor=pointer]:
                          - /url: /fms-ovs
                          - text: หน้าแรก
                        - link "ผลการลงคะแนนเสียง" [ref=e307] [cursor=pointer]:
                          - /url: /fms-ovs/results
                          - text: ผลการลงคะแนนเสียง
                      - link "Meet Candidates" [ref=e309] [cursor=pointer]:
                        - /url: /fms-ovs/candidates
                        - img [ref=e312]
                        - generic [ref=e317]: Meet Candidates
                      - link "เข้าสู่ระบบ" [ref=e318] [cursor=pointer]:
                        - /url: /fms-ovs/login
                        - img [ref=e319]
                        - generic [ref=e322]: เข้าสู่ระบบ
                - main [ref=e323]:
                  - generic [ref=e325] [cursor=pointer]:
                    - generic [ref=e328]: REAL-TIME UPDATE
                    - heading "ผลการเลือกตั้ง SAMO 50" [level=1] [ref=e329]
                    - paragraph [ref=e330]: ระบบเลือกตั้งสโมสรนักศึกษา คณะวิทยาการจัดการ ประจำปีการศึกษา 2570
                  - generic [ref=e332] [cursor=pointer]:
                    - generic [ref=e333]:
                      - generic [ref=e335]:
                        - paragraph [ref=e336]: คะแนนเสียงรวม
                        - paragraph [ref=e337]: "500"
                      - img [ref=e339]
                    - generic [ref=e341]:
                      - generic [ref=e342]:
                        - paragraph [ref=e343]: ผู้มีสิทธิ์
                        - paragraph [ref=e344]: 1,200
                      - img [ref=e346]
                    - generic [ref=e351]:
                      - generic [ref=e352]:
                        - paragraph [ref=e353]: ร้อยละ
                        - paragraph [ref=e354]: 41.67%
                      - img [ref=e356]
                  - heading "🏆 สรุปผลการเลือกตั้ง (Official Results)" [level=2] [ref=e361] [cursor=pointer]: 🏆 สรุปผลการเลือกตั้ง (Official Results)
                  - generic [ref=e363]:
                    - generic [ref=e365] [cursor=pointer]:
                      - generic [ref=e366]:
                        - img [ref=e368]
                        - generic [ref=e373]: "#1"
                      - generic [ref=e374]:
                        - generic [ref=e375]:
                          - generic [ref=e376]:
                            - heading "The Unity Concord Of FMS 2" [level=3] [ref=e377]
                            - paragraph [ref=e379]: เบอร์ 1
                          - img [ref=e380]
                        - generic [ref=e387]:
                          - generic [ref=e388]: "245"
                          - generic [ref=e389]: 49.0%
                    - generic [ref=e393] [cursor=pointer]:
                      - generic [ref=e394]:
                        - img [ref=e396]
                        - generic [ref=e401]: "#2"
                      - generic [ref=e402]:
                        - generic [ref=e404]:
                          - heading "อะไรไม่รู้ครับ" [level=3] [ref=e405]
                          - paragraph [ref=e407]: เบอร์ 2
                        - generic [ref=e409]:
                          - generic [ref=e410]: "187"
                          - generic [ref=e411]: 37.4%
                    - generic [ref=e415] [cursor=pointer]:
                      - generic [ref=e416]:
                        - img [ref=e418]
                        - generic [ref=e421]: "#3"
                      - generic [ref=e422]:
                        - generic [ref=e424]:
                          - heading "งดออกเสียง" [level=3] [ref=e425]
                          - paragraph [ref=e427]: Abstain
                        - generic [ref=e429]:
                          - generic [ref=e430]: "68"
                          - generic [ref=e431]: 13.6%
                  - generic [ref=e435] [cursor=pointer]:
                    - generic [ref=e436]:
                      - generic [ref=e437]:
                        - img [ref=e439]
                        - heading "แยกตามสาขา" [level=3] [ref=e441]
                      - application [ref=e445]:
                        - generic [ref=e470]:
                          - generic [ref=e472]: บัญชี
                          - generic [ref=e474]: การเงิน
                          - generic [ref=e476]: การจัดการ
                          - generic [ref=e478]: การตลาด
                          - generic [ref=e480]: ระบบสารสนเทศ
                          - generic [ref=e482]: การจัดการโลจิสติกส์
                    - generic [ref=e483]:
                      - generic [ref=e484]:
                        - generic [ref=e485]:
                          - img [ref=e487]
                          - heading "ชั้นปี" [level=3] [ref=e493]
                        - application [ref=e497]:
                          - generic [ref=e518]:
                            - generic [ref=e520]: ปี 1
                            - generic [ref=e522]: ปี 2
                            - generic [ref=e524]: ปี 3
                            - generic [ref=e526]: ปี 4
                      - generic [ref=e527]:
                        - generic [ref=e528]:
                          - img [ref=e530]
                          - heading "เพศ" [level=3] [ref=e533]
                        - generic [ref=e536]:
                          - list [ref=e538]:
                            - listitem [ref=e539]:
                              - img "Female legend icon" [ref=e540]
                              - text: Female
                            - listitem [ref=e542]:
                              - img "Male legend icon" [ref=e543]
                              - text: Male
                          - application [ref=e545]
                - paragraph [ref=e554]: © FMS@PSU 2027. All Rights Reserved.
  - alert [ref=e555]
  - generic [ref=e556]: บัญชี
```

# Test source

```ts
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
  123 | 
  124 |     await page.waitForTimeout(500);
  125 |     // Verify page didn't crash - check for error boundaries
  126 |     const errorBoundary = page.locator('text=Something went wrong');
  127 |     await expect(errorBoundary).toHaveCount(0);
  128 | 
  129 |     // Page content should still be rendered
  130 |     const mainContent = page.locator('main');
  131 |     await expect(mainContent).toBeVisible();
  132 |   });
  133 | });
  134 | 
  135 | // ─────────────────────────────────────────────────────────
  136 | // Module 2: Page Navigation (เลือกหน้าเว็บที่ต้องการแก้ไข)
  137 | // ─────────────────────────────────────────────────────────
  138 | test.describe('Module 2: Page Navigation', () => {
  139 | 
  140 |   test.beforeEach(async ({ page }) => {
  141 |     await loginAsAdmin(page);
  142 |     await goToTab(page, 'ออกแบบหน้าเว็บ');
  143 |   });
  144 | 
  145 |   test('TC2.1 - Click "รายชื่อผู้สมัคร" (Candidates) tab → panel and preview update', async ({ page }) => {
  146 |     const candidatesTab = page.locator('button').filter({ hasText: 'รายชื่อผู้สมัคร' });
  147 |     // There might be multiple buttons with this text (sidebar + page selector), find the page selector one
  148 |     const pageSelector = candidatesTab.last();
  149 |     await expect(pageSelector).toBeVisible({ timeout: 10000 });
  150 |     await pageSelector.click();
  151 |     await page.waitForTimeout(1500);
  152 | 
  153 |     // Check the editing indicator shows the candidates page
  154 |     const editingIndicator = page.locator('span[class*="font-bold"]').filter({ hasText: 'รายชื่อผู้สมัคร' });
  155 |     await expect(editingIndicator.first()).toBeVisible();
  156 |   });
  157 | 
  158 |   test('TC2.2 - Loading states during tab switching - no blank white screen', async ({ page }) => {
  159 |     const tabs = ['หน้าลงคะแนน', 'ผลคะแนน', 'รายชื่อผู้สมัคร', 'หน้าหลัก'];
  160 | 
  161 |     for (const tabName of tabs) {
  162 |       // Use the page selector buttons (not sidebar)
  163 |       const tab = page.locator('button').filter({ hasText: tabName });
  164 |       const pageTab = tab.last();
  165 |       if (await pageTab.isVisible()) {
  166 |         await pageTab.click();
  167 |         await page.waitForTimeout(1500);
  168 | 
  169 |         // Verify no blank white screen - main content must be present
  170 |         const mainContent = page.locator('main');
> 171 |         await expect(mainContent).toBeVisible();
      |                                   ^ Error: expect(locator).toBeVisible() failed
  172 | 
  173 |         // Verify no uncaught errors
  174 |         const errorText = page.locator('text=Something went wrong');
  175 |         await expect(errorText).toHaveCount(0);
  176 |       }
  177 |     }
  178 |   });
  179 | });
  180 | 
  181 | // ─────────────────────────────────────────────────────────
  182 | // Module 3: Main Sections (Drag & Drop & Visibility)
  183 | // ─────────────────────────────────────────────────────────
  184 | test.describe('Module 3: Main Sections (Reorder & Visibility)', () => {
  185 | 
  186 |   test.beforeEach(async ({ page }) => {
  187 |     await loginAsAdmin(page);
  188 |     await goToTab(page, 'ออกแบบหน้าเว็บ');
  189 |   });
  190 | 
  191 |   test('TC3.1 - Section list is displayed with reorder and visibility controls', async ({ page }) => {
  192 |     // Ensure on Home page
  193 |     const homePage = page.locator('button').filter({ hasText: 'หน้าหลัก' }).last();
  194 |     if (await homePage.isVisible()) {
  195 |       await homePage.click();
  196 |       await page.waitForTimeout(1000);
  197 |     }
  198 | 
  199 |     // Verify section items exist (looking for section type labels)
  200 |     const sectionLabels = ['Hero', 'Meet Candidates', 'สถิติ', 'Banner', 'โหวต'];
  201 |     let foundSections = 0;
  202 | 
  203 |     for (const label of sectionLabels) {
  204 |       const section = page.locator('span').filter({ hasText: new RegExp(label, 'i') });
  205 |       if (await section.count() > 0) {
  206 |         foundSections++;
  207 |       }
  208 |     }
  209 | 
  210 |     expect(foundSections).toBeGreaterThan(0);
  211 |   });
  212 | 
  213 |   test('TC3.2 - Toggle visibility switch exists and is clickable', async ({ page }) => {
  214 |     const homePage = page.locator('button').filter({ hasText: 'หน้าหลัก' }).last();
  215 |     if (await homePage.isVisible()) {
  216 |       await homePage.click();
  217 |       await page.waitForTimeout(1000);
  218 |     }
  219 | 
  220 |     // Find Eye/EyeOff toggle buttons
  221 |     const eyeButtons = page.locator('button[class*="rounded-lg"]').filter({
  222 |       has: page.locator('svg')
  223 |     });
  224 | 
  225 |     const eyeCount = await eyeButtons.count();
  226 |     expect(eyeCount).toBeGreaterThan(0);
  227 | 
  228 |     // Click first eye button to toggle visibility
  229 |     if (eyeCount > 0) {
  230 |       await eyeButtons.first().click();
  231 |       await page.waitForTimeout(500);
  232 | 
  233 |       // No crash
  234 |       const errorBoundary = page.locator('text=Something went wrong');
  235 |       await expect(errorBoundary).toHaveCount(0);
  236 |     }
  237 |   });
  238 | 
  239 |   test('TC3.3 - [Edge Case] Page does not crash when interacting with sections', async ({ page }) => {
  240 |     const homePage = page.locator('button').filter({ hasText: 'หน้าหลัก' }).last();
  241 |     if (await homePage.isVisible()) {
  242 |       await homePage.click();
  243 |       await page.waitForTimeout(1000);
  244 |     }
  245 | 
  246 |     // Verify no crash
  247 |     const errorBoundary = page.locator('text=Something went wrong');
  248 |     await expect(errorBoundary).toHaveCount(0);
  249 | 
  250 |     const mainContent = page.locator('main');
  251 |     await expect(mainContent).toBeVisible();
  252 |   });
  253 | });
  254 | 
  255 | // ─────────────────────────────────────────────────────────
  256 | // Module 4: Element & Style Editing
  257 | // ─────────────────────────────────────────────────────────
  258 | test.describe('Module 4: Element & Style Editing', () => {
  259 | 
  260 |   test.beforeEach(async ({ page }) => {
  261 |     await loginAsAdmin(page);
  262 |     await goToTab(page, 'ออกแบบหน้าเว็บ');
  263 |   });
  264 | 
  265 |   test('TC4.1 - Color/theme section is visible in the template area', async ({ page }) => {
  266 |     // Look for the template palette section
  267 |     const templateSection = page.locator('div').filter({ hasText: /เลือก Template/i });
  268 |     await expect(templateSection.first()).toBeVisible({ timeout: 10000 });
  269 | 
  270 |     // Look for color swatches (the colored circles in template cards)
  271 |     const colorSwatches = page.locator('span[class*="rounded-full"][style*="background"]');
```