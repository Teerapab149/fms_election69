"use client";

// v2 page components by family. Metadata (base family, which pages are built)
// lives in ./families.js so server code can read it without pulling in React
// components. A page listed there as built must have its component here.
//
// `cast` is the family's scene between confirming a vote and the success page;
// useVoteCast renders it instead of the shared VoteCastScene.

import BallotHome from "./ballot-official/BallotHome";
import BallotVote from "./ballot-official/BallotVote";
import BallotCastScene from "./ballot-official/BallotCastScene";
import BallotParty from "./ballot-official/BallotParty";
import BallotSuccess from "./ballot-official/BallotSuccess";
import BallotCandidates from "./ballot-official/BallotCandidates";
import BallotResults from "./ballot-official/BallotResults";
import BallotClosed from "./ballot-official/BallotClosed";
import BallotLogin from "./ballot-official/BallotLogin";

export const V2_PAGES = {
  "ballot-official": { home: BallotHome, vote: BallotVote, party: BallotParty, success: BallotSuccess, candidates: BallotCandidates, results: BallotResults, closed: BallotClosed, login: BallotLogin, cast: BallotCastScene },
};
