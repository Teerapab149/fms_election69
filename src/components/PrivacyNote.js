"use client";

// The one link to /privacy that login and ballot pages carry, in every template.
//
// It takes the colour, size and font of whatever it is placed in (color: inherit),
// so each template keeps its own voice and the same text never has to be styled
// eight times. It is a plain <a> + getPath() on purpose: /privacy is outside the
// template system, and an <a> is not a Next primitive, so nothing prefixes the
// base path for us (CLAUDE.md, Critical Conventions 1).
//
// `lead` is the sentence before the link ("การเข้าสู่ระบบใช้ข้อมูลจาก PSU Passport").
// `newTab` is for the ballot: a voter who opens the notice must not lose the box
// they have ticked, because the selection lives only in page state.

import { getPath } from "../utils/basePath";

export const PRIVACY_LINK_TEXT = "นโยบายความเป็นส่วนตัว";
export const PRIVACY_LOGIN_LEAD = "การเข้าสู่ระบบใช้ข้อมูลจาก PSU Passport อ่านว่าเก็บอะไรและนานแค่ไหนได้ที่";

export default function PrivacyNote({
  lead = "",
  newTab = false,
  as: Tag = "p",
  className = "",
  style,
  linkClassName = "",
  linkStyle,
  testId = "privacy-note",
}) {
  return (
    <Tag className={className} style={{ margin: 0, textAlign: "center", ...style }} data-privacy-note={testId}>
      {lead ? <>{lead}{" "}</> : null}
      <a
        href={getPath("/privacy")}
        data-privacy-link=""
        className={linkClassName}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        style={{
          color: "inherit",
          font: "inherit",
          letterSpacing: "inherit",
          textTransform: "none",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          whiteSpace: "nowrap",
          ...linkStyle,
        }}
      >
        {PRIVACY_LINK_TEXT}
      </a>
    </Tag>
  );
}
