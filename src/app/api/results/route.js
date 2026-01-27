import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { ELECTION_CONFIG } from "../../../utils/electionConfig";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const now = Date.now();
    let isAdmin = true;

    const { CAMPAIGN_START, ELECTION_START, ELECTION_END } = ELECTION_CONFIG;

    let status = "WAITING";
    let isPreCampaign = false;

    if (now >= ELECTION_END) {
      status = "ENDED";
    } else if (now >= ELECTION_START) {
      status = "ONGOING";
    } else if (now >= CAMPAIGN_START) {
      status = "WAITING";
    } else {
      status = "PRE_CAMPAIGN";
      isPreCampaign = true;
    }

    if (status === "ONGOING" || status === "ENDED") {
      isPreCampaign = false;
    }

    const allCandidates = await db.candidate.findMany({
      include: { members: true }
    });

    const realCandidates = allCandidates.filter(c => c.number > 0);
    const noVoteOption = allCandidates.find(c => c.number === 0);
    const disapproveOption = allCandidates.find(c => c.number === -1);

    let finalCandidates = [];

    if (realCandidates.length === 1) {
      finalCandidates = [...realCandidates];
      if (disapproveOption) finalCandidates.push(disapproveOption);
      if (noVoteOption) finalCandidates.push(noVoteOption);
    } else {
      finalCandidates = [...realCandidates];
      if (noVoteOption) finalCandidates.push(noVoteOption);
    }

    if (!isAdmin) {
      if (isPreCampaign) {
        finalCandidates = [];
      }
      else if (status !== "ENDED") {
        finalCandidates.sort((a, b) => a.number - b.number);
        finalCandidates = finalCandidates.map(c => ({ ...c, score: 0 }));
      }
      else {
        finalCandidates.sort((a, b) => b.score - a.score);
      }
    } else {
      finalCandidates.sort((a, b) => a.number - b.number);
    }

    const totalEligible = await db.user.count();
    const totalVotesReal = await db.user.count({ where: { isVoted: true } });

    const majorStats = await db.user.groupBy({ by: ['major'], where: { isVoted: true }, _count: { major: true } });
    const yearStats = await db.user.groupBy({ by: ['year'], where: { isVoted: true }, _count: { year: true } });
    const genderStats = await db.user.groupBy({ by: ['gender'], where: { isVoted: true }, _count: { gender: true } });

    return NextResponse.json({
      status: status,
      totalVotes: totalVotesReal,
      candidates: finalCandidates,
      campaignDate: CAMPAIGN_START,
      stats: {
        totalEligible: totalEligible,
        byMajor: majorStats.map(i => ({ name: i.major, value: i._count.major })),
        byYear: yearStats.map(i => ({ name: i.year, value: i._count.year })),
        byGender: genderStats.map(i => ({ name: i.gender, value: i._count.gender })),
      }
    });

  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ error: "Auth Failed / Decryption Error" }, { status: 403 });
  }
}