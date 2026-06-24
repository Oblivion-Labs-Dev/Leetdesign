"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

export function RoadmapScrollCanvas({
  children,
  onVisibleStepChange,
  moduleSpy = true,
  scrollRef: externalScrollRef,
}: {
  children: ReactNode;
  onVisibleStepChange?: (stepId: string) => void;
  moduleSpy?: boolean;
  scrollRef?: RefObject<HTMLDivElement | null>;
}) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !moduleSpy || !onVisibleStepChange) return;

    const sections = el.querySelectorAll("[data-module-section]");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.getAttribute("data-module-section");
        if (id) onVisibleStepChange(id);
      },
      { root: el, rootMargin: "-20% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [moduleSpy, onVisibleStepChange, children, scrollRef]);

  return (
    <div className="roadmap-scroll-canvas">
      <div
        ref={scrollRef}
        className="roadmap-path-scroll roadmap-scroll-area"
      >
        {children}
      </div>
    </div>
  );
}

export function scrollToModuleSection(
  stepId: string,
  scrollContainer?: HTMLElement | null,
) {
  const section = document.getElementById(`module-${stepId}`);
  if (!section) return;

  const container =
    scrollContainer ??
    section.closest<HTMLElement>(".roadmap-path-scroll");

  if (container) {
    const top =
      section.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      8;
    container.scrollTo({ top, behavior: "smooth" });
    return;
  }

  section.scrollIntoView({ behavior: "smooth", block: "start" });
}
