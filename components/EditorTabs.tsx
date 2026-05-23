"use client";

import { useState } from "react";
import clsx from "clsx";
import { Inspector } from "./Inspector";
import { TemplateGallery } from "./TemplateGallery";
import { BrandPanel } from "./BrandPanel";
import { NanoBananaPanel } from "./NanoBananaPanel";
import { BoostPanel } from "./BoostPanel";
import { ClientPanel } from "./ClientPanel";
import { MusicPanel } from "./MusicPanel";

type Tab = "design" | "templates" | "brand" | "ai" | "music" | "boost" | "clients";

const TABS: [Tab, string][] = [
  ["design", "Design"],
  ["templates", "Templates"],
  ["brand", "Brand"],
  ["ai", "AI"],
  ["music", "Music"],
  ["boost", "Boost"],
  ["clients", "Clients"],
];

export function EditorTabs() {
  const [tab, setTab] = useState<Tab>("design");
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 p-2 border-b border-white/10 overflow-x-auto">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={clsx(
              "flex-1 min-w-[64px] text-xs font-semibold rounded-md py-1.5 transition-colors",
              tab === k ? "bg-brand/20 text-brand-200 ring-1 ring-brand/40" : "text-white/60 hover:bg-white/5",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {tab === "design" && <Inspector />}
        {tab === "templates" && <TemplateGallery />}
        {tab === "brand" && <BrandPanel />}
        {tab === "ai" && <NanoBananaPanel />}
        {tab === "music" && <MusicPanel />}
        {tab === "boost" && <BoostPanel />}
        {tab === "clients" && <ClientPanel />}
      </div>
    </div>
  );
}
