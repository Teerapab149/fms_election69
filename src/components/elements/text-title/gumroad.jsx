"use client";

// text-title · atom · variant "gumroad" — a card/section heading (party name).
// Container-relative sizing (cqw) so it scales with its frame; clamps to 2 lines.

export default function TextTitleGumroad({ children, as = "h3", style }) {
  const Tag = as;
  return (
    <Tag className="el-title" data-element="text-title" data-variant="gumroad" style={style}>
      {children}
      <style jsx global>{`
        .el-title{
          margin:0; font-size:clamp(18px,2.4cqw,24px); font-weight:800; line-height:1.2;
          letter-spacing:-.01em; color:#26271c;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
        }
      `}</style>
    </Tag>
  );
}
