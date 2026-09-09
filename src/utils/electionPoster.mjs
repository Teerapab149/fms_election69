export const DEFAULT_ELECTION_POSTER_PATH = "/images/prob/samo49_1.png";

/**
 * Resolve the single poster source shared by every home-template family.
 *
 * The admin setting is authoritative when present. Clearing it deliberately
 * restores the checked-in poster, so a template never has to invent its own
 * empty-state behaviour or hardcode a second source.
 */
export function resolveElectionPosterPath(globalConfig = {}) {
  const configuredPath = String(globalConfig?.electionBannerUrl ?? "").trim();
  return configuredPath || DEFAULT_ELECTION_POSTER_PATH;
}
