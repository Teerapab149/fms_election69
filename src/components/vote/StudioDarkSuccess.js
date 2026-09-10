"use client";

import StudioDarkShell from "./StudioDarkShell";
import VoteSuccessExperience from "./VoteSuccessExperience";

export default function StudioDarkSuccess(props) {
  return (
    <StudioDarkShell active="vote" num="03b" label="Complete" labelTh="ลงคะแนนสำเร็จ" editorMode={props.editorMode} right={<span>RECORDED</span>}>
      <VoteSuccessExperience family="studio-dark" {...props} />
    </StudioDarkShell>
  );
}
