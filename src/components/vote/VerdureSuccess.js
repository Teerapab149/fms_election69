"use client";

import VerdureShell from "./VerdureShell";
import VoteSuccessExperience from "./VoteSuccessExperience";

// A growing shoot replaces the rotating seal; no invented ballot reference.
export default function VerdureSuccess(props) {
  return (
    <VerdureShell active="success" moss editorMode={props.editorMode}
      edge={{ num: "✓", label: "Together", th: "บันทึกสำเร็จ", right: true }}
      cornermarkTitle="Together" cornermarkSub="A shared future">
      <VoteSuccessExperience family="verdure" {...props} />
    </VerdureShell>
  );
}
