"use client";

// v2 page components by family. Metadata (base family, which pages are built)
// lives in ./families.js so server code can read it without pulling in React
// components. A page listed there as built must have its component here.
//
// `cast` is the family's scene between confirming a vote and the success page;
// useVoteCast renders it instead of the shared VoteCastScene.

import BallotHome from "./templates/ballot-official/BallotHome";
import BallotVote from "./templates/ballot-official/BallotVote";
import BallotCastScene from "./templates/ballot-official/BallotCastScene";
import BallotParty from "./templates/ballot-official/BallotParty";
import BallotSuccess from "./templates/ballot-official/BallotSuccess";
import BallotCandidates from "./templates/ballot-official/BallotCandidates";
import BallotResults from "./templates/ballot-official/BallotResults";
import BallotClosed from "./templates/ballot-official/BallotClosed";
import BallotLogin from "./templates/ballot-official/BallotLogin";
import GardenHome from "./templates/voter-garden/GardenHome";

export const V2_PAGES = {
  "ballot-official": { home: BallotHome, vote: BallotVote, party: BallotParty, success: BallotSuccess, candidates: BallotCandidates, results: BallotResults, closed: BallotClosed, login: BallotLogin, cast: BallotCastScene },
  // pages not listed here fall back to the base family (verdure) through resolve.js
  "voter-garden": { home: GardenHome },
};
