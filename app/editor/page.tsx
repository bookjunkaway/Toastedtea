"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
    <div className="h-screen w-screen flex flex-col">
      <TopBar />
      <PromptBar />
      <div className="flex-1 grid grid-cols-[1fr_380px] min-h-0">
        <main className="min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 bg-black/40">
            <PreviewCanvas />
          </div>
          <div className="p-3 border-t border-white/10">
            <SceneStrip />
          </div>
        </main>
        <aside className="border-l border-white/10 bg-black/40 min-h-0">
          <EditorTabs />
        </aside>
      </div>
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
