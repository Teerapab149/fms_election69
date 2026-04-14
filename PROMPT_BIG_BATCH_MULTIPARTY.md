# Big Batch Prompt: MultiPartyView Full Redesign + Vote Page Visual Upgrade

```
Read CLAUDE.md and STYLED_BLOCKS_ARCHITECTURE.md first.

This is a large task with 3 parts. Do them in order. Test each part compiles before moving to the next.

## Files to modify:
1. src/app/vote/page.js
2. src/components/vote/MultiPartyView.js (FULL REWRITE)
3. src/components/PartyCard.js

Do NOT modify: useVoteSystem.js, VoteFooter.js, SinglePartyView.js, VoteConfirmationModal.js, 
HomeContent.js, any block components, or admin pages.

---

## PART 1 — vote/page.js: Navbar + Background for multi-party

Only affect the multi-party rendering path. SinglePartyView uses createPortal and manages its own layout — don't touch it.

### Changes:

a) Add import: import Navbar from '../../components/Navbar';

b) In the multi-party return block, restructure to:

```jsx
<div className="min-h-screen flex flex-col font-sans pb-32 overflow-x-hidden relative bg-[#F8F9FD]">
  
  {/* Background decoration — fixed, behind everything */}
  <div className="fixed inset-0 z-0 pointer-events-none">
    <div className="absolute top-[-10%] right-[-5%] w-[60%] md:w-[40%] h-[40%] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
    <div className="absolute bottom-[-5%] left-[-5%] w-[50%] md:w-[35%] h-[35%] bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-[80px] md:blur-[120px]"></div>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px]"></div>
  </div>

  {/* Navbar */}
  <div className="relative z-50">
    <Navbar />
  </div>

  {/* Main content */}
  <main className="flex-grow container mx-auto px-4 py-8 relative z-10 max-w-4xl w-full">
    {/* Header */}
    <div className="text-center mb-8 animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-purple-100 shadow-sm mb-4">
        <span className="text-xs font-bold text-[#8A2680]">ลงคะแนนเสียง</span>
      </div>
      <h1 className="text-3xl md:text-5xl font-black text-[#1a1a2e] mb-2 tracking-tight">
        เลือกตั้ง<span className="text-[#8A2680]">สโมสรนักศึกษา</span>
      </h1>
      <p className="mt-2 text-sm md:text-base text-slate-500 font-medium">
        สวัสดีคุณ <span className="font-bold text-[#8A2680]">{session?.user?.name}</span> โปรดเลือกพรรคที่ต้องการ
      </p>
    </div>

    <MultiPartyView ... />  {/* existing props unchanged */}
  </main>

  <VoteFooter ... />  {/* unchanged */}
  {/* Modals unchanged */}
</div>
```

c) Keep ALL existing props to MultiPartyView, VoteFooter, modals exactly as-is.
d) Keep pb-32 on outer container (VoteFooter needs space).
e) The isSingleParty ternary stays — only the multi-party branch gets this treatment.

---

## PART 2 — MultiPartyView.js: Full rewrite with LEGO config + responsive redesign

### New props signature:
```jsx
export default function MultiPartyView({ 
  regularParties, 
  specialOptions, 
  selectedPartyId, 
  onSelect, 
  onViewDetails,
  config = {}
})
```

### Config destructuring with auto-adaptive defaults:
```jsx
const partyCount = regularParties.length;

const {
  gridCols = "auto",
  cardVariant = "auto",
  showDivider = true,
  abstainStyle = "auto"
} = config;

const resolvedCardVariant = cardVariant === "auto"
  ? (partyCount <= 3 ? "grid" : "compact")
  : cardVariant;

const resolvedAbstainStyle = abstainStyle === "auto"
  ? (partyCount <= 3 ? "standard" : "compact")
  : abstainStyle;
```

### Grid layout — CRITICAL RESPONSIVE BEHAVIOR:

```jsx
const getGridClasses = () => {
  switch (gridCols) {
    case "2": return "grid-cols-1 sm:grid-cols-2";
    case "3": return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    default:  // "auto"
      if (partyCount <= 2) return "grid-cols-1 sm:grid-cols-2";
      if (partyCount <= 4) return "grid-cols-1 sm:grid-cols-2";
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }
};
```

IMPORTANT: Mobile (< 640px) is ALWAYS 1 column (grid-cols-1). 
Cards go full-width stacked on mobile. This is the key design change.
On sm+ they go 2-col. On lg+ they can go 3-col if many parties.

### Grid container:
```jsx
<div className={`grid ${getGridClasses()} gap-3 sm:gap-4 lg:gap-6 max-w-2xl mx-auto`}>
  {regularParties.map((party, index) => (
    <div 
      key={party.id} 
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
    >
      <PartyCard
        party={party}
        isSelected={selectedPartyId === party.id}
        onSelect={onSelect}
        onViewDetails={onViewDetails}
        variant={resolvedCardVariant}
      />
    </div>
  ))}
</div>
```

### Divider (showDivider):
```jsx
{showDivider && (
  <div className="flex items-center gap-4 py-4 max-w-xs mx-auto opacity-60">
    <div className="h-px bg-slate-300 flex-1"></div>
    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">หรือ</span>
    <div className="h-px bg-slate-300 flex-1"></div>
  </div>
)}
{!showDivider && <div className="h-4" />}
```

### Abstain button (resolvedAbstainStyle):

"standard" — full button with icon circle + title + subtitle + check badge:
```jsx
<div className="max-w-md mx-auto px-4">
  <button onClick={() => onSelect(specialOptions.abstain.id)}
    className={`relative w-full rounded-2xl p-4 flex items-center justify-center gap-3 
    transition-all duration-300 border-2
    ${selectedPartyId === specialOptions.abstain.id
      ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200/50 scale-[1.02]'
      : 'bg-white border-slate-100 text-slate-700 hover:border-orange-300 hover:shadow-md'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
      ${selectedPartyId === specialOptions.abstain.id ? 'bg-white/20' : 'bg-orange-50 text-orange-600'}`}>
      <Ban size={22} strokeWidth={2.5} />
    </div>
    <div className="text-left">
      <div className="font-bold text-base leading-tight">งดออกเสียง</div>
      <div className="text-[10px] opacity-70">ไม่ประสงค์ลงคะแนนเสียง</div>
    </div>
    {selectedPartyId === specialOptions.abstain.id && (
      <div className="absolute top-2 right-2 bg-white text-orange-600 p-0.5 rounded-full">
        <Check size={12} strokeWidth={4} />
      </div>
    )}
  </button>
</div>
```

"compact" — centered pill:
```jsx
<div className="flex justify-center">
  <button onClick={() => onSelect(specialOptions.abstain.id)}
    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full 
    transition-all duration-300 border
    ${selectedPartyId === specialOptions.abstain.id
      ? 'bg-orange-500 border-orange-500 text-white shadow-md'
      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}>
    <Ban size={18} strokeWidth={2.5} />
    <span className="font-bold text-sm">งดออกเสียง</span>
    {selectedPartyId === specialOptions.abstain.id && (
      <Check size={14} strokeWidth={3} className="text-white" />
    )}
  </button>
</div>
```

"minimal" — text link:
```jsx
<div className="flex justify-center py-2">
  <button onClick={() => onSelect(specialOptions.abstain.id)}
    className={`inline-flex items-center gap-2 px-4 py-2 transition-all
    ${selectedPartyId === specialOptions.abstain.id
      ? 'text-orange-600 font-bold'
      : 'text-slate-400 hover:text-orange-500 hover:underline'}`}>
    <Ban size={16} strokeWidth={2} />
    <span className="text-sm">งดออกเสียง</span>
  </button>
</div>
```

### HARD RULES:
- ALL regularParties MUST render always — no filtering
- Abstain MUST always show — no hiding
- NO disapprove button in MultiPartyView ever
- onSelect logic untouched
- selectedPartyId logic untouched

---

## PART 3 — PartyCard.js: onViewDetails + variant="compact" + bigger logo

### Add onViewDetails to props:
```jsx
export default function PartyCard({ party, isSelected, onSelect, onViewDetails, variant = 'grid' })
```

### Logo size upgrade (for variant="grid"):
Change from current w-16 h-16 md:w-24 md:h-24 to:
- w-20 h-20 md:w-24 md:h-24 (bigger on mobile)
- Add gradient background to logo circle: bg-gradient-to-br from-purple-50 to-purple-100
- Add colored border: border-[3px] with theme-aware color when selected

### Add variant="compact" support:
When variant === "compact":
- Logo: w-12 h-12 md:w-16 md:h-16 (smaller)
- Padding: p-3 pt-7 pb-3 (tighter)
- Name: text-xs md:text-sm font-bold, line-clamp-2
- No slogan display
- No "ดูรายละเอียด" button
- Badge: text-[8px] px-1.5 py-0.5 (smaller)
- Keep all selected-state styling (border, bg, check overlay)

### onViewDetails wiring:
Find the existing <Link href="/party?id=...&source=vote"> section at the bottom of the card.

Replace with conditional:
```jsx
{!isSpecialOption && variant !== "compact" && (
  <div className="mt-2 md:mt-3 z-30">
    {onViewDetails ? (
      <button
        onClick={(e) => { e.stopPropagation(); onViewDetails(party); }}
        className={/* same classes as the existing Link */}
      >
        <PlayCircle size={14} className="..." /> ดูรายละเอียด
      </button>
    ) : (
      <Link
        href={`/party?id=${party.number}&source=vote`}
        onClick={(e) => e.stopPropagation()}
        className={/* same classes as existing */}
      >
        <PlayCircle size={14} className="..." /> ดูรายละเอียด
      </Link>
    )}
  </div>
)}
```

### Slogan display:
Add slogan display for variant="grid" (below party name, above detail button):
```jsx
{variant !== "compact" && party.slogan && (
  <p className="text-[10px] md:text-xs text-slate-400 line-clamp-1 w-full px-2 mb-1">
    "{party.slogan}"
  </p>
)}
```

---

## Verification checklist (test all before finishing):

1. [ ] vote/page.js: Multi-party page has Navbar + gradient background
2. [ ] vote/page.js: SinglePartyView path completely unchanged
3. [ ] MultiPartyView: Mobile (< 640px) shows 1-column stacked cards
4. [ ] MultiPartyView: sm+ shows 2-column grid
5. [ ] MultiPartyView: No config passed → works identical with auto defaults
6. [ ] MultiPartyView: 2 parties → "grid" cards with slogan + detail button
7. [ ] MultiPartyView: 4+ parties → "compact" cards, pill abstain
8. [ ] MultiPartyView: Abstain button always visible regardless of config
9. [ ] MultiPartyView: NO disapprove button anywhere
10. [ ] MultiPartyView: Selected state works (border + color + scale + check)
11. [ ] MultiPartyView: Staggered entrance animation on cards
12. [ ] PartyCard: onViewDetails → opens modal (not navigate away)
13. [ ] PartyCard: No onViewDetails → Link to /party?id=... (existing behavior)
14. [ ] PartyCard: variant="compact" renders smaller card without slogan/detail
15. [ ] PartyCard: Logo is bigger than before for variant="grid"
16. [ ] VoteFooter still works (appears at bottom, shows selection, confirms vote)
17. [ ] VoteConfirmationModal still works for multi-party

## Constraints:
- No new npm dependencies
- Preserve all Thai comments
- Use getPath() for internal URLs  
- Color tokens: #8A2680 primary, #9333EA accent, orange-500 abstain
- Icons: lucide-react only
- Tailwind only for styling
- Mobile-first responsive (320px → 1440px)
```
