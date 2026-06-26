/**
 * scripts/archive-year.js — READ-ONLY snapshot of "this year" into git
 * (5-year-readiness Pillar 2.2). Run it AFTER results are certified and BEFORE
 * the annual reset, so each year's exact results + look are preserved forever:
 *   "SAMO 49 = this design + these results."
 *
 *   node scripts/archive-year.js            # label auto-derived (e.g. SAMO-49)
 *   node scripts/archive-year.js --label X  # override the folder label
 *
 * Writes (does NOT touch the DB):
 *   archive/<label>/results.json   final tallies + turnout demographics
 *   archive/<label>/design.json    the active design overlay (template + tokens)
 *   archive/<label>/README.md      human-readable summary
 *
 * Re-hydration (optional, later): import design.json into the ARCHIVE_TEMPLATES
 * map in src/components/admin/editor/templates/index.js to make that exact year
 * selectable again. The base template itself already lives in git.
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const VALID_YEARS = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];

function slug(s) {
  return String(s).trim().replace(/\s+/g, "-").replace(/[^\w\-ก-๙]/g, "");
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const cfg = (await prisma.systemConfig.findFirst({ where: { id: 1 } })) || {};
    const gc = cfg.globalConfig || {};

    // ── Label: SAMO-49 → academicYear → fallback ──────────────────────────────
    const label =
      arg("--label") ||
      (gc.electionNumber != null ? `${gc.electionNamePrefix || "SAMO"}-${gc.electionNumber}` : null) ||
      (gc.electionName ? slug(gc.electionName) : null) ||
      (gc.academicYearTh ? `year-${gc.academicYearTh}` : null) ||
      `archive-${new Date().toISOString().slice(0, 10)}`;

    // ── Results: scores are the source of truth (anonymize-safe) ──────────────
    const candidates = await prisma.candidate.findMany({
      select: { id: true, name: true, number: true, score: true },
      orderBy: { number: "asc" },
    });
    const totalEligible = await prisma.user.count({ where: { year: { in: VALID_YEARS } } });
    const totalVotes = await prisma.user.count({ where: { isVoted: true, year: { in: VALID_YEARS } } });

    const cAll = { _count: { _all: true } };
    const votedWhere = { isVoted: true, year: { in: VALID_YEARS } };
    const eligWhere = { year: { in: VALID_YEARS } };
    const [majorVoted, yearVoted, genderVoted, majorElig, yearElig, genderElig] = await Promise.all([
      prisma.user.groupBy({ by: ["major"], where: votedWhere, ...cAll, orderBy: { major: "asc" } }),
      prisma.user.groupBy({ by: ["year"], where: votedWhere, ...cAll, orderBy: { year: "asc" } }),
      prisma.user.groupBy({ by: ["gender"], where: votedWhere, ...cAll, orderBy: { gender: "asc" } }),
      prisma.user.groupBy({ by: ["major"], where: eligWhere, ...cAll, orderBy: { major: "asc" } }),
      prisma.user.groupBy({ by: ["year"], where: eligWhere, ...cAll, orderBy: { year: "asc" } }),
      prisma.user.groupBy({ by: ["gender"], where: eligWhere, ...cAll, orderBy: { gender: "asc" } }),
    ]);
    const countBy = (rows, key) => Object.fromEntries(rows.map((r) => [r[key] ?? "—", r._count._all]));
    const mkGroup = (votedRows, eligRows, key) => {
      const voted = countBy(votedRows, key);
      return eligRows
        .filter((r) => r[key] != null && String(r[key]).trim() !== "")
        .map((r) => ({ name: r[key], value: voted[r[key]] ?? 0, eligible: r._count._all }));
    };

    const generatedAt = new Date().toISOString();
    const results = {
      label,
      generatedAt,
      election: {
        name: gc.electionName ?? null,
        number: gc.electionNumber ?? null,
        academicYearTh: gc.academicYearTh ?? null,
        calendarYear: gc.electionCalendarYear ?? null,
      },
      certified: !!cfg.showResult,
      ballotsAnonymized: !!gc.ballotsAnonymized,
      turnout: {
        eligible: totalEligible,
        voted: totalVotes,
        percent: totalEligible ? +((totalVotes / totalEligible) * 100).toFixed(2) : 0,
      },
      candidates: candidates.map((c) => ({ name: c.name, number: c.number, score: c.score || 0 })),
      demographics: {
        byYear: mkGroup(yearVoted, yearElig, "year"),
        byMajor: mkGroup(majorVoted, majorElig, "major"),
        byGender: mkGroup(genderVoted, genderElig, "gender"),
      },
    };

    // ── Design overlay: what makes THIS deployment's look ─────────────────────
    let templateRow = null;
    if (cfg.activeTemplateId) {
      const t = await prisma.template.findUnique({ where: { slug: cfg.activeTemplateId } }).catch(() => null);
      if (t) templateRow = { slug: t.slug, name: t.name, pages: t.pages, elements: t.elements, theme: t.theme };
    }
    const design = {
      label,
      generatedAt,
      activeTemplateId: cfg.activeTemplateId ?? "classic",
      // Built-in templates live in git; these overlays are what the committee
      // actually customised on top, so they capture this year's exact look.
      pageLayout: cfg.pageLayout ?? null,
      themeConfig: cfg.themeConfig ?? null,
      globalConfig: gc,
      template: templateRow, // non-null only when the active template is a DB row
    };

    // ── Write files ───────────────────────────────────────────────────────────
    const outDir = path.join(process.cwd(), "archive", label);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(outDir, "design.json"), JSON.stringify(design, null, 2));

    const realRanked = [...results.candidates].filter((c) => c.number > 0).sort((a, b) => b.score - a.score);
    const fmtRow = (c) => `| ${c.number} | ${c.name} | ${c.score} |`;
    const readme = `# ${gc.electionName || label} — archived results & design

_Generated ${generatedAt} by \`scripts/archive-year.js\`._
${cfg.showResult ? "" : "\n> ⚠️ Snapshotted while results were NOT yet revealed — scores may not be final.\n"}
## Results
- **Turnout:** ${results.turnout.voted} / ${results.turnout.eligible} eligible (**${results.turnout.percent}%**)
- **Anonymized:** ${results.ballotsAnonymized ? "yes (individual ballots wiped, tallies frozen)" : "no"}

| № | Party | Score |
|---|---|---|
${realRanked.map(fmtRow).join("\n")}
${results.candidates.filter((c) => c.number <= 0).map(fmtRow).join("\n")}

${realRanked.length ? `**Winner:** ${realRanked[0].name} (${realRanked[0].score} votes)\n` : ""}
## Turnout by year
${results.demographics.byYear.map((g) => `- ${g.name}: ${g.value}/${g.eligible}`).join("\n") || "- (none)"}

## Design
- **Active template:** \`${design.activeTemplateId}\`
- Overlays captured: pageLayout ${design.pageLayout ? "✓" : "—"}, themeConfig ${design.themeConfig ? "✓" : "—"}, DB template ${design.template ? "✓" : "— (built-in, lives in git)"}
- Full machine snapshot: [\`design.json\`](./design.json) · [\`results.json\`](./results.json)

To make this exact year selectable again, register \`design.json\` into
\`ARCHIVE_TEMPLATES\` in \`src/components/admin/editor/templates/index.js\`.
`;
    fs.writeFileSync(path.join(outDir, "README.md"), readme);

    console.log(`\n  ✓ Archived "${label}" → archive/${label}/`);
    console.log(`    results.json  (turnout ${results.turnout.percent}%, ${results.candidates.length} options)`);
    console.log(`    design.json   (template: ${design.activeTemplateId})`);
    console.log(`    README.md`);
    if (!cfg.showResult) console.log(`    ⚠ results were not revealed — re-run after certification for final scores.`);
    console.log(`\n  Next: git add archive/${label} && commit — this year is now preserved.\n`);
  } catch (e) {
    console.error("  ✗ archive failed:", e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
