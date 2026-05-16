# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-console.spec.js >> Module 4: Element & Style Editing >> TC4.2 - [Edge Case] UI does not crash after template interactions
- Location: e2e\admin-console.spec.js:276:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main')
Expected: visible
Error: strict mode violation: locator('main') resolved to 2 elements:
    1) <main class="flex-1 p-6 md:p-8 bg-gray-50">…</main> aka getByRole('main').filter({ hasText: 'เลือก Template' })
    2) <main class="flex-grow py-6 lg:py-6 xl:py-10 px-6 md:px-12 lg:px-24 relative z-10">…</main> aka getByRole('main').filter({ hasText: 'เลือก Template' }).getByRole('main')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('main')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
              - generic [ref=e60]: ● มินิมอล
            - generic [ref=e61]:
              - button "คลาสสิก Classic แบบทางการ สีม่วง/ขาว เหมาะกับการเลือกตั้งทั่วไป" [ref=e62] [cursor=pointer]:
                - generic [ref=e66]: คลาสสิก
                - generic [ref=e67]: Classic
                - paragraph [ref=e68]: แบบทางการ สีม่วง/ขาว เหมาะกับการเลือกตั้งทั่วไป
              - button "โมเดิร์นดาร์ก Modern Dark พื้นหลังเข้ม สีสดตัดกัน เหมาะกับแคมเปญที่ดูทันสมัย" [ref=e69] [cursor=pointer]:
                - generic [ref=e73]: โมเดิร์นดาร์ก
                - generic [ref=e74]: Modern Dark
                - paragraph [ref=e75]: พื้นหลังเข้ม สีสดตัดกัน เหมาะกับแคมเปญที่ดูทันสมัย
              - button "สนุกสนาน Playful สีสันสดใส rounded มากขึ้น เหมาะกับบรรยากาศเลือกตั้งที่ fun" [ref=e76] [cursor=pointer]:
                - generic [ref=e80]: สนุกสนาน
                - generic [ref=e81]: Playful
                - paragraph [ref=e82]: สีสันสดใส rounded มากขึ้น เหมาะกับบรรยากาศเลือกตั้งที่ fun
              - button "มินิมอล Minimal ขาวสะอาด typography เด่น เรียบหรู ดูเป็นมืออาชีพ" [ref=e83] [cursor=pointer]:
                - img [ref=e85]
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
              - button "ผลคะแนน /results" [ref=e117] [cursor=pointer]:
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
              - generic [ref=e153]: "กำลังแก้ไข: หน้าหลัก"
            - generic [ref=e154]:
              - generic [ref=e155]: ● ยังไม่ได้เผยแพร่
              - button "บันทึกร่าง" [ref=e156] [cursor=pointer]:
                - img [ref=e157]
                - text: บันทึกร่าง
              - button "เผยแพร่จริง" [ref=e163] [cursor=pointer]:
                - img [ref=e164]
                - text: เผยแพร่จริง
          - generic [ref=e167]:
            - generic [ref=e168]:
              - generic [ref=e169]:
                - generic [ref=e170]:
                  - img [ref=e172]
                  - generic [ref=e177]:
                    - heading "Sections หน้าหลัก" [level=3] [ref=e178]
                    - paragraph [ref=e179]: จัดลำดับ เปิด/ปิด และปรับแต่ง Section ต่างๆ บนหน้า Home
                - generic [ref=e180]:
                  - generic [ref=e182]:
                    - img [ref=e184]
                    - generic [ref=e191]:
                      - button [disabled] [ref=e192]:
                        - img [ref=e193]
                      - button [ref=e195] [cursor=pointer]:
                        - img [ref=e196]
                    - button "Hero (Countdown + Title) hero" [ref=e198] [cursor=pointer]:
                      - img [ref=e200]
                      - generic [ref=e203]:
                        - generic [ref=e204]: Hero (Countdown + Title)
                        - text: hero
                      - img [ref=e205]
                    - button [ref=e207] [cursor=pointer]:
                      - img [ref=e208]
                  - generic [ref=e212]:
                    - img [ref=e214]
                    - generic [ref=e221]:
                      - button [ref=e222] [cursor=pointer]:
                        - img [ref=e223]
                      - button [ref=e225] [cursor=pointer]:
                        - img [ref=e226]
                    - button "สถิติผู้โหวต (Stats) stats" [ref=e228] [cursor=pointer]:
                      - img [ref=e230]
                      - generic [ref=e232]:
                        - generic [ref=e233]: สถิติผู้โหวต (Stats)
                        - text: stats
                      - img [ref=e234]
                    - button [ref=e236] [cursor=pointer]:
                      - img [ref=e237]
                  - generic [ref=e241]:
                    - img [ref=e243]
                    - generic [ref=e250]:
                      - button [ref=e251] [cursor=pointer]:
                        - img [ref=e252]
                      - button [ref=e254] [cursor=pointer]:
                        - img [ref=e255]
                    - button "ปุ่มโหวต (Vote CTA) voteCTA" [ref=e257] [cursor=pointer]:
                      - img [ref=e259]
                      - generic [ref=e262]:
                        - generic [ref=e263]: ปุ่มโหวต (Vote CTA)
                        - text: voteCTA
                      - img [ref=e264]
                    - button [ref=e266] [cursor=pointer]:
                      - img [ref=e267]
                  - generic [ref=e271]:
                    - img [ref=e273]
                    - generic [ref=e280]:
                      - button [ref=e281] [cursor=pointer]:
                        - img [ref=e282]
                      - button [ref=e284] [cursor=pointer]:
                        - img [ref=e285]
                    - button "Election Banner electionBanner" [ref=e287] [cursor=pointer]:
                      - img [ref=e289]
                      - generic [ref=e293]:
                        - generic [ref=e294]: Election Banner
                        - text: electionBanner
                      - img [ref=e295]
                    - button [ref=e297] [cursor=pointer]:
                      - img [ref=e298]
                  - generic [ref=e304]:
                    - img [ref=e306]
                    - generic [ref=e313]:
                      - button [ref=e314] [cursor=pointer]:
                        - img [ref=e315]
                      - button [disabled] [ref=e317]:
                        - img [ref=e318]
                    - button "Meet Candidates meetCandidates" [ref=e320] [cursor=pointer]:
                      - img [ref=e322]
                      - generic [ref=e327]:
                        - generic [ref=e328]: Meet Candidates
                        - text: meetCandidates
                      - img [ref=e329]
                    - button [ref=e331] [cursor=pointer]:
                      - img [ref=e332]
              - generic [ref=e335]:
                - img [ref=e336]
                - paragraph [ref=e342]: คลิก element ใน preview เพื่อแก้ไข
            - generic [ref=e344]:
              - generic [ref=e345]:
                - generic [ref=e346]:
                  - img [ref=e347]
                  - generic [ref=e350]: Live Preview
                  - generic [ref=e351]: · หน้าหลัก
                  - generic "ยังไม่ได้เผยแพร่" [ref=e352]
                - generic [ref=e353]:
                  - generic [ref=e354]:
                    - button "Desktop" [ref=e355] [cursor=pointer]:
                      - img [ref=e356]
                      - text: Desktop
                    - button "Mobile" [ref=e358] [cursor=pointer]:
                      - img [ref=e359]
                      - text: Mobile
                  - button "เปิดในแท็บใหม่" [ref=e362] [cursor=pointer]:
                    - img [ref=e363]
              - generic [ref=e369]:
                - navigation [ref=e371]:
                  - generic [ref=e372]:
                    - link "FMS 50th FMS Name" [ref=e373] [cursor=pointer]:
                      - /url: /fms-ovs
                      - img "FMS 50th" [ref=e375]
                      - img "FMS Name" [ref=e377]
                    - generic [ref=e378]:
                      - generic [ref=e379]:
                        - link "หน้าแรก" [ref=e380] [cursor=pointer]:
                          - /url: /fms-ovs
                          - text: หน้าแรก
                        - link "ผลการลงคะแนนเสียง" [ref=e382] [cursor=pointer]:
                          - /url: /fms-ovs/results
                          - text: ผลการลงคะแนนเสียง
                      - link "Meet Candidates" [ref=e384] [cursor=pointer]:
                        - /url: /fms-ovs/candidates
                        - img [ref=e387]
                        - generic [ref=e392]: Meet Candidates
                      - link "เข้าสู่ระบบ" [ref=e393] [cursor=pointer]:
                        - /url: /fms-ovs/login
                        - img [ref=e394]
                        - generic [ref=e397]: เข้าสู่ระบบ
                - main [ref=e398]:
                  - generic [ref=e400]:
                    - generic [ref=e401]:
                      - generic [ref=e404]:
                        - heading "SAMO 50" [level=1] [ref=e407] [cursor=pointer]:
                          - generic [ref=e408]: SAMO
                          - generic [ref=e409]: "50"
                        - heading "โครงการเลือกตั้งคณะกรรมการบริหาร" [level=2] [ref=e412] [cursor=pointer]
                        - heading "สโมสรนักศึกษาคณะวิทยาการจัดการ" [level=3] [ref=e414] [cursor=pointer]
                      - button "เข้าสู่ระบบ / Sign in" [ref=e419] [cursor=pointer]:
                        - generic [ref=e420]:
                          - text: เข้าสู่ระบบ / Sign in
                          - img [ref=e422]
                      - link "FMS ELECTION 2026 รู้จักผู้สมัคร ของคุณหรือยัง? ดูรายชื่อพรรค" [ref=e428] [cursor=pointer]:
                        - /url: /fms-ovs/candidates
                        - generic [ref=e435]:
                          - generic [ref=e436]:
                            - generic [ref=e441]: FMS ELECTION 2026
                            - heading "รู้จักผู้สมัคร ของคุณหรือยัง?" [level=3] [ref=e442]:
                              - text: รู้จักผู้สมัคร
                              - text: ของคุณหรือยัง?
                            - generic [ref=e443]:
                              - generic [ref=e444]: ดูรายชื่อพรรค
                              - img [ref=e445]
                          - generic:
                            - generic:
                              - img
                            - generic:
                              - img
                            - generic:
                              - img
                    - generic [ref=e450] [cursor=pointer]:
                      - generic [ref=e451]:
                        - img [ref=e453]
                        - generic [ref=e459]:
                          - heading "สถิติผู้เข้าร่วมลงคะแนนโหวต" [level=3] [ref=e460]
                          - generic [ref=e461]: อัปเดตข้อมูลแบบ Real-time
                      - generic [ref=e462]:
                        - generic [ref=e466]:
                          - generic [ref=e467]:
                            - img [ref=e468]
                            - generic [ref=e471]: ใช้สิทธิแล้ว (Voted)
                          - generic [ref=e472]:
                            - generic [ref=e473]: "342"
                            - generic [ref=e474]: คน
                        - generic [ref=e475]:
                          - generic [ref=e476]:
                            - generic [ref=e477]: ความคืบหน้า
                            - img [ref=e478]
                          - generic [ref=e482]: 28.50%
                        - generic [ref=e485]:
                          - generic [ref=e486]:
                            - generic [ref=e487]: ผู้มีสิทธิรวม
                            - img [ref=e488]
                          - generic [ref=e493]:
                            - generic [ref=e494]: 1,200
                            - generic [ref=e495]: คน
                - paragraph [ref=e497]: © FMS@PSU 2027. All Rights Reserved.
  - alert [ref=e498]
```

# Test source

```ts
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
  272 |     const swatchCount = await colorSwatches.count();
  273 |     expect(swatchCount).toBeGreaterThan(0);
  274 |   });
  275 | 
  276 |   test('TC4.2 - [Edge Case] UI does not crash after template interactions', async ({ page }) => {
  277 |     // Click a template card (which shows colors)
  278 |     const templateCards = page.locator('button').filter({ hasText: 'มินิมอล' });
  279 |     if (await templateCards.count() > 0) {
  280 |       await templateCards.first().click();
  281 |       await page.waitForTimeout(500);
  282 | 
  283 |       // Confirm
  284 |       const confirmBtn = page.locator('button').filter({ hasText: /ยืนยัน|ตกลง/i });
  285 |       if (await confirmBtn.count() > 0) {
  286 |         await confirmBtn.first().click();
  287 |         await page.waitForTimeout(1000);
  288 |       }
  289 |     }
  290 | 
  291 |     // Verify page didn't crash
  292 |     const errorBoundary = page.locator('text=Something went wrong');
  293 |     await expect(errorBoundary).toHaveCount(0);
  294 | 
  295 |     const mainContent = page.locator('main');
> 296 |     await expect(mainContent).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
  297 |   });
  298 | });
  299 | 
  300 | // ─────────────────────────────────────────────────────────
  301 | // Module 5: Stateful Elements
  302 | // ─────────────────────────────────────────────────────────
  303 | test.describe('Module 5: Stateful Elements', () => {
  304 | 
  305 |   test.beforeEach(async ({ page }) => {
  306 |     await loginAsAdmin(page);
  307 |     await goToTab(page, 'ออกแบบหน้าเว็บ');
  308 |   });
  309 | 
  310 |   test('TC5.1 - Live Preview renders with stateful content (countdown/status)', async ({ page }) => {
  311 |     // Check for Live Preview panel
  312 |     const livePreview = page.locator('div').filter({ hasText: /Live Preview/i });
  313 |     await expect(livePreview.first()).toBeVisible({ timeout: 10000 });
  314 | 
  315 |     // Verify no crash
  316 |     const errorBoundary = page.locator('text=Something went wrong');
  317 |     await expect(errorBoundary).toHaveCount(0);
  318 |   });
  319 | 
  320 |   test('TC5.2 - State tabs can be switched without crash', async ({ page }) => {
  321 |     // Navigate and interact with the page - check for any state toggle areas
  322 |     const mainContent = page.locator('main');
  323 |     await expect(mainContent).toBeVisible();
  324 | 
  325 |     // Verify no crash
  326 |     const errorBoundary = page.locator('text=Something went wrong');
  327 |     await expect(errorBoundary).toHaveCount(0);
  328 |   });
  329 | });
  330 | 
  331 | // ─────────────────────────────────────────────────────────
  332 | // Module 6: Global Settings (ตั้งค่าทั่วไป)
  333 | // ─────────────────────────────────────────────────────────
  334 | test.describe('Module 6: Global Settings', () => {
  335 | 
  336 |   test.beforeEach(async ({ page }) => {
  337 |     await loginAsAdmin(page);
  338 |     await goToTab(page, 'ตั้งค่าทั่วไป');
  339 |   });
  340 | 
  341 |   test('TC6.1 - Global config tab loads with form fields', async ({ page }) => {
  342 |     // Check for the Global Config heading
  343 |     const heading = page.locator('h2').filter({ hasText: 'ตั้งค่าทั่วไป' });
  344 |     await expect(heading).toBeVisible({ timeout: 10000 });
  345 | 
  346 |     // Check for form inputs
  347 |     const inputs = page.locator('input');
  348 |     const inputCount = await inputs.count();
  349 |     expect(inputCount).toBeGreaterThan(0);
  350 |   });
  351 | 
  352 |   test('TC6.2 - Change election name → input accepts and holds the value', async ({ page }) => {
  353 |     // Find the election name input - look for label "ชื่อการเลือกตั้ง"
  354 |     const label = page.locator('label').filter({ hasText: 'ชื่อการเลือกตั้ง' });
  355 |     await expect(label.first()).toBeVisible({ timeout: 10000 });
  356 | 
  357 |     // Find the input field associated with it (sibling)
  358 |     const inputField = label.first().locator('..').locator('..').locator('input').first();
  359 |     await inputField.clear();
  360 |     await inputField.fill('SAMO 50 TEST');
  361 |     await page.waitForTimeout(500);
  362 | 
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
```