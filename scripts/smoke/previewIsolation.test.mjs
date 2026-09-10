import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { makeParties } from '../../src/utils/templatePreviewMocks.js';
import { DUMMY_PARTIES_MULTI, DUMMY_PARTY_DETAIL, DUMMY_USER } from '../../src/utils/editorDummyData.js';

test('all preview parties have complete fictional content and 20 distinct avatars', () => {
  for (const party of [...makeParties(6), ...DUMMY_PARTIES_MULTI]) {
    assert.ok(party.name.includes('ตัวอย่าง'));
    assert.ok(party.logoMeaning && party.policies.length >= 4 && party.missions.length >= 2);
    assert.ok(party.members.length >= 20);
    assert.equal(party.members.filter(m => m.position === 'นายกสโมสรนักศึกษา').length, 1);
    assert.equal(new Set(party.members.map(m => m.imageUrl)).size, 20);
    const images = [party.logoUrl, party.officialImageUrl, ...party.groupImageUrls,
      ...party.mobileHeroImage, ...party.members.flatMap(m => [m.imageUrl, m.modalImageUrl])];
    for (const path of images) {
      assert.ok(path.startsWith('/images/template-preview/'), path);
      assert.ok(existsSync(new URL('../../public' + path, import.meta.url)), path);
    }
    assert.equal(Object.keys(party.socials).length, 4);
    for (const url of Object.values(party.socials)) assert.equal(new URL(url).hostname, 'preview.invalid');
  }
});
test('legacy editor adapters use the same fictional identity and team', () => {
  assert.equal(DUMMY_PARTY_DETAIL.name, makeParties(1)[0].name);
  assert.equal(DUMMY_PARTY_DETAIL.team.length, 20);
  assert.ok(DUMMY_USER.studentId.startsWith('DEMO-'));
});
test('fixtures cannot depend on live uploads or database modules', () => {
  for (const file of ['templatePreviewMocks.js', 'editorDummyData.js']) {
    const source = readFileSync(new URL('../../src/utils/' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\/images\/(members|candidates)\/|fetch\(|prisma|from.*lib\/db/);
  }
});
