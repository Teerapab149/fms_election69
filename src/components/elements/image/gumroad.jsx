"use client";

// image · atom · variant "gumroad" — a filling image (object-fit) with a soft
// empty placeholder. Layer-1 brick: it just fills its parent frame; the frame
// owns size / ratio / border / radius. Pass `empty` (or no src) → placeholder.

import { Users } from "lucide-react";

export default function ImageGumroad({ src, alt = "", fit = "cover", empty = false, iconSize = 40, emptyContent, style }) {
  const BaseCss = (
    <style jsx global>{`
      .el-img{ display:block; width:100%; height:100%; object-position:center; }
      .el-img--empty{ display:grid; place-items:center; color:#C9B8A6; background:transparent; }
    `}</style>
  );

  if (!src || empty) {
    return (
      <div className="el-img el-img--empty" data-element="image" data-variant="gumroad" style={style}>
        {emptyContent != null ? emptyContent : <Users size={iconSize} />}
        {BaseCss}
      </div>
    );
  }
  return (
    <>
      <img className="el-img" data-element="image" data-variant="gumroad" src={src} alt={alt} loading="lazy" style={{ objectFit: fit, ...style }} />
      {BaseCss}
    </>
  );
}
