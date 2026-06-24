"use client";

import type { LessonTocEntry } from "@/types/learn";

export function LessonTableOfContents({ items }: { items: LessonTocEntry[] }) {
  if (items.length === 0) return null;

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="learn-inline-toc" aria-label="Table of contents">
      <p className="learn-inline-toc-heading">Table of contents</p>
      <ul className="learn-inline-toc-list">
        {items.map((item) => (
          <li key={item.id} className="learn-inline-toc-item">
            <button type="button" className="learn-inline-toc-link" onClick={() => jump(item.id)}>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
