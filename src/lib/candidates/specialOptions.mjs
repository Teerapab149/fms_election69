export const ABSTAIN_OPTION = Object.freeze({
  name: "งดออกเสียง",
  number: 0,
});

export const DISAPPROVE_OPTION = Object.freeze({
  name: "ไม่รับรอง",
  number: -1,
});

export function getSpecialOptionPlan(candidateNumbers = []) {
  const numbers = candidateNumbers.map(Number).filter(Number.isFinite);
  const realPartyCount = numbers.filter((number) => number > 0).length;

  return {
    realPartyCount,
    createAbstain: !numbers.includes(ABSTAIN_OPTION.number),
    createDisapprove:
      realPartyCount === 1 && !numbers.includes(DISAPPROVE_OPTION.number),
    removeDisapprove:
      realPartyCount !== 1 && numbers.includes(DISAPPROVE_OPTION.number),
  };
}

/**
 * Keep database-backed ballot choices aligned with the number of real parties.
 * Call inside the same transaction that adds/removes/renumbers a real party so
 * the UI can never render a choice whose Candidate row does not exist.
 */
export async function syncCandidateSpecialOptions(client) {
  const candidates = await client.candidate.findMany({
    select: { id: true, number: true, score: true },
  });
  const plan = getSpecialOptionPlan(candidates.map((candidate) => candidate.number));

  if (plan.createAbstain) {
    await client.candidate.create({ data: ABSTAIN_OPTION });
  }

  if (plan.createDisapprove) {
    await client.candidate.create({ data: DISAPPROVE_OPTION });
  }

  if (plan.removeDisapprove) {
    const disapprove = candidates.find(
      (candidate) => candidate.number === DISAPPROVE_OPTION.number
    );
    if (disapprove?.score) {
      throw new Error("ไม่สามารถลบตัวเลือกไม่รับรองที่มีคะแนนแล้วได้");
    }
    if (disapprove) {
      await client.candidate.delete({ where: { id: disapprove.id } });
    }
  }

  return plan;
}
