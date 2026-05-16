# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-console.spec.js >> Module 5: Stateful Elements >> TC5.2 - State tabs can be switched without crash
- Location: e2e\admin-console.spec.js:320:3

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
        - button "ออกแบบหน้าเว็บ" [active] [ref=e20] [cursor=pointer]:
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
              - button "บันทึกร่าง" [ref=e155] [cursor=pointer]:
                - img [ref=e156]
                - text: บันทึกร่าง
              - button "เผยแพร่จริง" [disabled] [ref=e161]:
                - img [ref=e162]
                - text: เผยแพร่จริง
          - generic [ref=e165]:
            - generic [ref=e166]:
              - generic [ref=e167]:
                - generic [ref=e168]:
                  - img [ref=e170]
                  - generic [ref=e175]:
                    - heading "Sections หน้าหลัก" [level=3] [ref=e176]
                    - paragraph [ref=e177]: จัดลำดับ เปิด/ปิด และปรับแต่ง Section ต่างๆ บนหน้า Home
                - generic [ref=e178]:
                  - generic [ref=e180]:
                    - img [ref=e182]
                    - generic [ref=e189]:
                      - button [disabled] [ref=e190]:
                        - img [ref=e191]
                      - button [ref=e193] [cursor=pointer]:
                        - img [ref=e194]
                    - button "Hero (Countdown + Title) hero" [ref=e196] [cursor=pointer]:
                      - img [ref=e198]
                      - generic [ref=e201]:
                        - generic [ref=e202]: Hero (Countdown + Title)
                        - text: hero
                      - img [ref=e203]
                    - button [ref=e205] [cursor=pointer]:
                      - img [ref=e206]
                  - generic [ref=e210]:
                    - img [ref=e212]
                    - generic [ref=e219]:
                      - button [ref=e220] [cursor=pointer]:
                        - img [ref=e221]
                      - button [ref=e223] [cursor=pointer]:
                        - img [ref=e224]
                    - button "สถิติผู้โหวต (Stats) stats" [ref=e226] [cursor=pointer]:
                      - img [ref=e228]
                      - generic [ref=e230]:
                        - generic [ref=e231]: สถิติผู้โหวต (Stats)
                        - text: stats
                      - img [ref=e232]
                    - button [ref=e234] [cursor=pointer]:
                      - img [ref=e235]
                  - generic [ref=e239]:
                    - img [ref=e241]
                    - generic [ref=e248]:
                      - button [ref=e249] [cursor=pointer]:
                        - img [ref=e250]
                      - button [ref=e252] [cursor=pointer]:
                        - img [ref=e253]
                    - button "ปุ่มโหวต (Vote CTA) voteCTA" [ref=e255] [cursor=pointer]:
                      - img [ref=e257]
                      - generic [ref=e260]:
                        - generic [ref=e261]: ปุ่มโหวต (Vote CTA)
                        - text: voteCTA
                      - img [ref=e262]
                    - button [ref=e264] [cursor=pointer]:
                      - img [ref=e265]
                  - generic [ref=e269]:
                    - img [ref=e271]
                    - generic [ref=e278]:
                      - button [ref=e279] [cursor=pointer]:
                        - img [ref=e280]
                      - button [ref=e282] [cursor=pointer]:
                        - img [ref=e283]
                    - button "Election Banner electionBanner" [ref=e285] [cursor=pointer]:
                      - img [ref=e287]
                      - generic [ref=e291]:
                        - generic [ref=e292]: Election Banner
                        - text: electionBanner
                      - img [ref=e293]
                    - button [ref=e295] [cursor=pointer]:
                      - img [ref=e296]
                  - generic [ref=e300]:
                    - img [ref=e302]
                    - generic [ref=e309]:
                      - button [ref=e310] [cursor=pointer]:
                        - img [ref=e311]
                      - button [disabled] [ref=e313]:
                        - img [ref=e314]
                    - button "Meet Candidates meetCandidates" [ref=e316] [cursor=pointer]:
                      - img [ref=e318]
                      - generic [ref=e323]:
                        - generic [ref=e324]: Meet Candidates
                        - text: meetCandidates
                      - img [ref=e325]
                    - button [ref=e327] [cursor=pointer]:
                      - img [ref=e328]
              - generic [ref=e331]:
                - img [ref=e332]
                - paragraph [ref=e338]: คลิก element ใน preview เพื่อแก้ไข
            - generic [ref=e340]:
              - generic [ref=e341]:
                - generic [ref=e342]:
                  - img [ref=e343]
                  - generic [ref=e346]: Live Preview
                  - generic [ref=e347]: · หน้าหลัก
                - generic [ref=e348]:
                  - generic [ref=e349]:
                    - button "Desktop" [ref=e350] [cursor=pointer]:
                      - img [ref=e351]
                      - text: Desktop
                    - button "Mobile" [ref=e353] [cursor=pointer]:
                      - img [ref=e354]
                      - text: Mobile
                  - button "เปิดในแท็บใหม่" [ref=e357] [cursor=pointer]:
                    - img [ref=e358]
              - generic [ref=e364]:
                - navigation [ref=e366]:
                  - generic [ref=e367]:
                    - link "FMS 50th FMS Name" [ref=e368] [cursor=pointer]:
                      - /url: /fms-ovs
                      - img "FMS 50th" [ref=e370]
                      - img "FMS Name" [ref=e372]
                    - generic [ref=e373]:
                      - generic [ref=e374]:
                        - link "หน้าแรก" [ref=e375] [cursor=pointer]:
                          - /url: /fms-ovs
                          - text: หน้าแรก
                        - link "ผลการลงคะแนนเสียง" [ref=e377] [cursor=pointer]:
                          - /url: /fms-ovs/results
                          - text: ผลการลงคะแนนเสียง
                      - link "Meet Candidates" [ref=e379] [cursor=pointer]:
                        - /url: /fms-ovs/candidates
                        - img [ref=e382]
                        - generic [ref=e387]: Meet Candidates
                      - link "เข้าสู่ระบบ" [ref=e388] [cursor=pointer]:
                        - /url: /fms-ovs/login
                        - img [ref=e389]
                        - generic [ref=e392]: เข้าสู่ระบบ
                - main [ref=e393]:
                  - generic [ref=e395]:
                    - generic [ref=e396]:
                      - generic [ref=e398]:
                        - generic [ref=e401]:
                          - generic [ref=e402]:
                            - img [ref=e403]
                            - generic [ref=e405]: SEE YOU 2027
                          - generic [ref=e406]:
                            - generic [ref=e407]:
                              - generic [ref=e408]: "274"
                              - generic [ref=e409]: d
                            - generic [ref=e410]: ":"
                            - generic [ref=e411]:
                              - generic [ref=e412]: "15"
                              - generic [ref=e413]: h
                            - generic [ref=e414]: ":"
                            - generic [ref=e415]:
                              - generic [ref=e416]: "10"
                              - generic [ref=e417]: m
                            - generic [ref=e418]: ":"
                            - generic [ref=e419]:
                              - generic [ref=e420]: "55"
                              - generic [ref=e421]: s
                        - generic [ref=e422]:
                          - heading "SAMO 50" [level=1] [ref=e425] [cursor=pointer]:
                            - generic [ref=e426]: SAMO
                            - generic [ref=e427]: "50"
                          - heading "โครงการเลือกตั้งคณะกรรมการบริหาร" [level=2] [ref=e430] [cursor=pointer]
                          - heading "สโมสรนักศึกษาคณะวิทยาการจัดการ" [level=3] [ref=e432] [cursor=pointer]
                          - generic [ref=e435] [cursor=pointer]:
                            - img [ref=e436]
                            - text: ประจำปีการศึกษา 2570
                      - button "เข้าสู่ระบบ / Sign in" [ref=e442] [cursor=pointer]:
                        - generic [ref=e443]:
                          - text: เข้าสู่ระบบ / Sign in
                          - img [ref=e445]
                      - link "FMS ELECTION 2026 รู้จักผู้สมัคร ของคุณหรือยัง? ดูรายชื่อพรรค" [ref=e451] [cursor=pointer]:
                        - /url: /fms-ovs/candidates
                        - generic [ref=e458]:
                          - generic [ref=e459]:
                            - generic [ref=e464]: FMS ELECTION 2026
                            - heading "รู้จักผู้สมัคร ของคุณหรือยัง?" [level=3] [ref=e465]:
                              - text: รู้จักผู้สมัคร
                              - text: ของคุณหรือยัง?
                            - generic [ref=e466]:
                              - generic [ref=e467]: ดูรายชื่อพรรค
                              - img [ref=e468]
                          - generic:
                            - generic:
                              - img
                            - generic:
                              - img
                            - generic:
                              - img
                    - generic [ref=e470]:
                      - generic [ref=e473] [cursor=pointer]:
                        - generic [ref=e474]:
                          - img [ref=e476]
                          - generic [ref=e482]:
                            - heading "สถิติผู้เข้าร่วมลงคะแนนโหวต" [level=3] [ref=e483]
                            - generic [ref=e484]: อัปเดตข้อมูลแบบ Real-time
                        - generic [ref=e485]:
                          - generic [ref=e489]:
                            - generic [ref=e490]:
                              - img [ref=e491]
                              - generic [ref=e494]: ใช้สิทธิแล้ว (Voted)
                            - generic [ref=e495]:
                              - generic [ref=e496]: "342"
                              - generic [ref=e497]: คน
                          - generic [ref=e498]:
                            - generic [ref=e499]:
                              - generic [ref=e500]: ความคืบหน้า
                              - img [ref=e501]
                            - generic [ref=e505]: 28.50%
                          - generic [ref=e508]:
                            - generic [ref=e509]:
                              - generic [ref=e510]: ผู้มีสิทธิรวม
                              - img [ref=e511]
                            - generic [ref=e516]:
                              - generic [ref=e517]: 1,200
                              - generic [ref=e518]: คน
                      - img "Campaign Poster 0" [ref=e526] [cursor=pointer]
                - paragraph [ref=e528]: © FMS@PSU 2027. All Rights Reserved.
  - alert [ref=e529]
```

# Test source

```ts
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
  296 |     await expect(mainContent).toBeVisible();
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
> 323 |     await expect(mainContent).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
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
```