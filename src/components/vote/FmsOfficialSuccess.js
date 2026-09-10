"use client";

import FmsOfficialShell from "./FmsOfficialShell";
import VoteSuccessExperience from "./VoteSuccessExperience";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";

export default function FmsOfficialSuccess(props) {
  const gc = useGlobalConfig() || {};
  const end = resolveElectionDates(gc)?.ELECTION_END;
  const validEnd = end && !Number.isNaN(new Date(end).getTime());
  return (
    <FmsOfficialShell active="vote" plain editorMode={props.editorMode}>
      <VoteSuccessExperience family="fms-official" {...props}>
        {validEnd && <p className="mt-4 text-xs leading-relaxed text-[var(--fo-muted)]">กำหนดปิดหีบ {formatThaiDate(end)} เวลา {formatThaiTime(end)} · ผลคะแนนจะแสดงเมื่อผู้ดูแลเปิดเผยผล และคุณทำแบบประเมินแล้ว</p>}
      </VoteSuccessExperience>
    </FmsOfficialShell>
  );
}
