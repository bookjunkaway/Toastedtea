"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutPanelLeft, X } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { PromptBar } from "@/components/PromptBar";
import { PreviewCanvas } from "@/components/PreviewCanvas";
import { SceneStrip } from "@/components/SceneStrip";
import { EditorTabs } from "@/components/EditorTabs";
import { useEditor } from "@/lib/store";

function EditorBody() {
  const params = useSearchParams();
  const loadTemplate = useEditor((s) => s.loadTemplate);
  const selectScene = useEditor((s) => s.selectScene);
  const project = useEditor((s) => s.project);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const tpl = params.get("tpl");
    if (tpl) loadTemplate(tpl);
  }, [params, loadTemplate]);

  useEffect(() => {
    if (!project.scenes.length) return;
    selectScene(project.scenes[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-[100dvh] w-screen flex flex-col">
      <TopBar />
      <PromptBar />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
        <main className="min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 bg-black/40">
            <PreviewCanvas />
          </div>
          <div className="p-2 sm:p-3 border-t border-white/10">
            <SceneStrip />
          </div>
        </main>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block border-l border-white/10 bg-black/40 min-h-0">
          <EditorTabs />
        </aside>
      </div>

      {/* Mobile floating "open panel" button */}
      <button
        onClick={() => setPanelOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 size-14 rounded-full bg-brand text-ink-950 shadow-2xl flex items-center justify-center active:scale-95"
        aria-label="Open editor panels"
      >
        <LayoutPanelLeft className="size-6" />
      </button>

      {/* Mobile bottom-sheet panel */}
      {panelOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="mt-auto h-[85dvh] rounded-t-2xl bg-ink-950 border-t border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div className="text-sm font-bold">Edit ad</div>
              <button
                onClick={() => setPanelOpen(false)}
                className="size-9 flex items-center justify-center rounded-md hover:bg-white/5"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <EditorTabs />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white/60">Loading studio…</div>}>
      <EditorBody />
    </Suspense>
  );
}
