// When a voter voted, said only as finely as the ballot itself records it.
//
// Rule 11 (docs/v2-design-rules.md): the Ballot row keeps an hour bucket and a
// sequential `seq`, never a minute. A minute-precise time — or "you were voter
// #343" — on a screen a voter screenshots and shares is a handle for lining the
// voter up against ballot order. Every template's success page formats the
// voter's own time through here; none of them may show anything finer.
//
// Pure (no React, no app imports) so it is tested directly by node.

const TZ = "Asia/Bangkok";

/** "6 ก.พ. 2569 ช่วง 10.00–11.00 น." — or null for a missing / invalid time. */
export function hourWindow(value) {
  const d = value instanceof Date ? value : value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const date = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: TZ }).format(d);
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: TZ }).format(d));
  const pad = (n) => String(n % 24).padStart(2, "0");
  return `${date} ช่วง ${pad(h)}.00–${pad(h + 1)}.00 น.`;
}
