"use client";

import VoteSuccessExperience from "./VoteSuccessExperience";
import { GumroadBaseStyles } from "../home/GumroadTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import SiteNavbar from "../elements/site-navbar/gumroad";
import SiteFooter from "../elements/site-footer/gumroad";

// Shared actions, with a chunky completion ticket and the existing family chrome.
export default function GumroadSuccess(props) {
  const gc = useGlobalConfig() || {};
  return (
    <div className="fms-app gum-root flex min-h-screen flex-col" style={{ background: "var(--cream)", color: "var(--ink)", fontFamily: "var(--font-anuphan), sans-serif" }}>
      <GumroadBaseStyles />
      <SiteNavbar />
      <main className="flex-1 w-full"><VoteSuccessExperience family="gumroad" {...props} /></main>
      <SiteFooter faculty={gc.facultyShortEn || "FMS"} uni={gc.university || "PSU"} year={gc.copyrightYear || gc.electionCalendarYear || ""} />
    </div>
  );
}
