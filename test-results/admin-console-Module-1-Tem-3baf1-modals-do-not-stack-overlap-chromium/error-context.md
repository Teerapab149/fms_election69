# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-console.spec.js >> Module 1: Template Selection >> TC1.4 - [Edge Case] Rapid template clicking - modals do not stack/overlap
- Location: e2e\admin-console.spec.js:107:3

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
                      - generic [ref=e402]:
                        - heading "SAMO 50" [level=1] [ref=e405] [cursor=pointer]:
                          - generic [ref=e406]: SAMO
                          - generic [ref=e407]: "50"
                        - heading "โครงการเลือกตั้งคณะกรรมการบริหาร" [level=2] [ref=e410] [cursor=pointer]
                        - heading "สโมสรนักศึกษาคณะวิทยาการจัดการ" [level=3] [ref=e412] [cursor=pointer]
                        - generic [ref=e415] [cursor=pointer]:
                          - img [ref=e416]
                          - text: ประจำปีการศึกษา 2570
                      - button "เข้าสู่ระบบ / Sign in" [ref=e422] [cursor=pointer]:
                        - generic [ref=e423]:
                          - text: เข้าสู่ระบบ / Sign in
                          - img [ref=e425]
                      - link "FMS ELECTION 2026 รู้จักผู้สมัคร ของคุณหรือยัง? ดูรายชื่อพรรค" [ref=e431] [cursor=pointer]:
                        - /url: /fms-ovs/candidates
                        - generic [ref=e438]:
                          - generic [ref=e439]:
                            - generic [ref=e444]: FMS ELECTION 2026
                            - heading "รู้จักผู้สมัคร ของคุณหรือยัง?" [level=3] [ref=e445]:
                              - text: รู้จักผู้สมัคร
                              - text: ของคุณหรือยัง?
                            - generic [ref=e446]:
                              - generic [ref=e447]: ดูรายชื่อพรรค
                              - img [ref=e448]
                          - generic:
                            - generic:
                              - img
                            - generic:
                              - img
                            - generic:
                              - img
                    - generic [ref=e450]:
                      - generic [ref=e453] [cursor=pointer]:
                        - generic [ref=e454]:
                          - img [ref=e456]
                          - generic [ref=e462]:
                            - heading "สถิติผู้เข้าร่วมลงคะแนนโหวต" [level=3] [ref=e463]
                            - generic [ref=e464]: อัปเดตข้อมูลแบบ Real-time
                        - generic [ref=e465]:
                          - generic [ref=e469]:
                            - generic [ref=e470]:
                              - img [ref=e471]
                              - generic [ref=e474]: ใช้สิทธิแล้ว (Voted)
                            - generic [ref=e475]:
                              - generic [ref=e476]: "342"
                              - generic [ref=e477]: คน
                          - generic [ref=e478]:
                            - generic [ref=e479]:
                              - generic [ref=e480]: ความคืบหน้า
                              - img [ref=e481]
                            - generic [ref=e485]: 28.50%
                          - generic [ref=e488]:
                            - generic [ref=e489]:
                              - generic [ref=e490]: ผู้มีสิทธิรวม
                              - img [ref=e491]
                            - generic [ref=e496]:
                              - generic [ref=e497]: 1,200
                              - generic [ref=e498]: คน
                      - img "Campaign Poster 0" [ref=e506] [cursor=pointer]
                - paragraph [ref=e508]: © FMS@PSU 2027. All Rights Reserved.
  - alert [ref=e509]
```

# Test source

```ts
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
  123 | 
  124 |     await page.waitForTimeout(500);
  125 |     // Verify page didn't crash - check for error boundaries
  126 |     const errorBoundary = page.locator('text=Something went wrong');
  127 |     await expect(errorBoundary).toHaveCount(0);
  128 | 
  129 |     // Page content should still be rendered
  130 |     const mainContent = page.locator('main');
> 131 |     await expect(mainContent).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
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
  171 |         await expect(mainContent).toBeVisible();
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
```