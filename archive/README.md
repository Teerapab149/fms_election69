# Yearly archives

One folder per election year — the permanent, git-committed record of
**"that year = these results + this exact look."** Each folder is produced by
`node scripts/archive-year.js` (read-only; it never touches the DB):

```
archive/
  SAMO-49/
    results.json   final tallies + turnout demographics (scores are the source of truth)
    design.json    the active design overlay (template id + pageLayout/themeConfig/globalConfig)
    README.md      human-readable summary (winner, turnout %, design)
```

## When to run it (annual lifecycle)

1. **End of a cycle — after results are certified** (`showResult=true`, scores final):
   `node scripts/archive-year.js` → review → `git add archive/<label> && git commit`.
   Do this BEFORE the annual reset, while the final scores still exist.
2. *(optional)* After **Anonymize** in the admin panel — re-running is safe; tallies
   are frozen in `Candidate.score`, so the numbers are identical, just with
   `ballotsAnonymized: true` recorded.
3. **New year:** reset via the admin panel (RESET_VOTES, delete test parties,
   `showResult=false`, `systemMode=AUTO`, import the new roll, seed real parties),
   then verify with `node scripts/preflight-year.js` before opening the polls.

## Re-activating an old year's look

The base templates already live in git. To make an archived year's *exact* overlay
selectable again, register its `design.json` into the `ARCHIVE_TEMPLATES` map in
`src/components/admin/editor/templates/index.js` (the slot is wired, empty by default).
