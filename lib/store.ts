"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "./id";
import {
  AdGoal,
  AspectRatioKey,
  BrandInputs,
  DEFAULT_BRAND,
  DEFAULT_PALETTE,
  Layer,
  Project,
  Scene,
} from "./types";
import { getTemplate, listTemplates } from "./templates";

interface EditorState {
  project: Project;
  selectedSceneId: string | null;
  selectedLayerId: string | null;
  isPlaying: boolean;
  /** Current preview time in seconds within the active scene */
  previewTime: number;

  /* project-level */
  loadTemplate: (templateId: string) => void;
  setAspectRatio: (a: AspectRatioKey) => void;
  setGoal: (g: AdGoal) => void;
  updateBrand: (patch: Partial<BrandInputs>) => void;
  renameProject: (name: string) => void;
  setAudio: (audio: Project["audio"]) => void;

  /* scenes */
  selectScene: (id: string | null) => void;
  addScene: (afterId?: string) => void;
  deleteScene: (id: string) => void;
  duplicateScene: (id: string) => void;
  moveScene: (id: string, direction: -1 | 1) => void;
  updateScene: (id: string, patch: Partial<Scene>) => void;

  /* layers */
  selectLayer: (id: string | null) => void;
  addLayer: (sceneId: string, layer: Layer) => void;
  deleteLayer: (sceneId: string, layerId: string) => void;
  updateLayer: (sceneId: string, layerId: string, patch: Partial<Layer>) => void;
  reorderLayer: (sceneId: string, layerId: string, direction: -1 | 1) => void;

  /* preview */
  play: () => void;
  pause: () => void;
  setPreviewTime: (t: number) => void;
}

function newProject(): Project {
  const tpl = listTemplates()[0];
  const scenes = tpl.build({
    aspect: "9:16",
    brand: DEFAULT_BRAND,
    palette: DEFAULT_PALETTE,
  });
  return {
    id: uid("p"),
    name: "Book Junk Away — Tampa Free Quote",
    aspectRatio: "9:16",
    goal: tpl.goal,
    brand: DEFAULT_BRAND,
    scenes,
    palette: DEFAULT_PALETTE,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function touch(p: Project): Project {
  return { ...p, updatedAt: Date.now() };
}

export const useEditor = create<EditorState>()(
  persist(
    (set, get) => ({
      project: newProject(),
      selectedSceneId: null,
      selectedLayerId: null,
      isPlaying: false,
      previewTime: 0,

      loadTemplate: (templateId) => {
        const tpl = getTemplate(templateId);
        if (!tpl) return;
        const { project } = get();
        const scenes = tpl.build({
          aspect: project.aspectRatio,
          brand: project.brand,
          palette: project.palette,
        });
        set({
          project: touch({ ...project, scenes, goal: tpl.goal, name: `${project.brand.companyName} — ${tpl.name}` }),
          selectedSceneId: scenes[0]?.id ?? null,
          selectedLayerId: null,
          previewTime: 0,
        });
      },

      setAspectRatio: (a) =>
        set((s) => ({ project: touch({ ...s.project, aspectRatio: a }) })),

      setGoal: (g) => set((s) => ({ project: touch({ ...s.project, goal: g }) })),

      updateBrand: (patch) =>
        set((s) => ({ project: touch({ ...s.project, brand: { ...s.project.brand, ...patch } }) })),

      renameProject: (name) =>
        set((s) => ({ project: touch({ ...s.project, name }) })),

      setAudio: (audio) => set((s) => ({ project: touch({ ...s.project, audio }) })),

      selectScene: (id) => set({ selectedSceneId: id, selectedLayerId: null, previewTime: 0 }),

      addScene: (afterId) =>
        set((s) => {
          const project = s.project;
          const newScene: Scene = {
            id: uid("sc"),
            name: `Scene ${project.scenes.length + 1}`,
            duration: 2.0,
            background: { kind: "gradient", from: "#0f172a", to: "#1e293b", angle: 180 },
            layers: [],
            transitionIn: "fade",
            transitionInDuration: 0.3,
          };
          const idx = afterId ? project.scenes.findIndex((sc) => sc.id === afterId) : project.scenes.length - 1;
          const scenes = [...project.scenes];
          scenes.splice(idx + 1, 0, newScene);
          return { project: touch({ ...project, scenes }), selectedSceneId: newScene.id };
        }),

      deleteScene: (id) =>
        set((s) => {
          const scenes = s.project.scenes.filter((sc) => sc.id !== id);
          return {
            project: touch({ ...s.project, scenes }),
            selectedSceneId: scenes[0]?.id ?? null,
          };
        }),

      duplicateScene: (id) =>
        set((s) => {
          const idx = s.project.scenes.findIndex((sc) => sc.id === id);
          if (idx < 0) return s;
          const src = s.project.scenes[idx];
          const copy: Scene = {
            ...src,
            id: uid("sc"),
            name: `${src.name} copy`,
            layers: src.layers.map((l) => ({ ...l, id: uid(l.type[0]) })),
          };
          const scenes = [...s.project.scenes];
          scenes.splice(idx + 1, 0, copy);
          return { project: touch({ ...s.project, scenes }), selectedSceneId: copy.id };
        }),

      moveScene: (id, direction) =>
        set((s) => {
          const idx = s.project.scenes.findIndex((sc) => sc.id === id);
          const target = idx + direction;
          if (idx < 0 || target < 0 || target >= s.project.scenes.length) return s;
          const scenes = [...s.project.scenes];
          const [moved] = scenes.splice(idx, 1);
          scenes.splice(target, 0, moved);
          return { project: touch({ ...s.project, scenes }) };
        }),

      updateScene: (id, patch) =>
        set((s) => ({
          project: touch({
            ...s.project,
            scenes: s.project.scenes.map((sc) => (sc.id === id ? ({ ...sc, ...patch } as Scene) : sc)),
          }),
        })),

      selectLayer: (id) => set({ selectedLayerId: id }),

      addLayer: (sceneId, layer) =>
        set((s) => ({
          project: touch({
            ...s.project,
            scenes: s.project.scenes.map((sc) =>
              sc.id === sceneId ? { ...sc, layers: [...sc.layers, layer] } : sc,
            ),
          }),
          selectedLayerId: layer.id,
        })),

      deleteLayer: (sceneId, layerId) =>
        set((s) => ({
          project: touch({
            ...s.project,
            scenes: s.project.scenes.map((sc) =>
              sc.id === sceneId ? { ...sc, layers: sc.layers.filter((l) => l.id !== layerId) } : sc,
            ),
          }),
          selectedLayerId: null,
        })),

      updateLayer: (sceneId, layerId, patch) =>
        set((s) => ({
          project: touch({
            ...s.project,
            scenes: s.project.scenes.map((sc) =>
              sc.id === sceneId
                ? {
                    ...sc,
                    layers: sc.layers.map((l) => (l.id === layerId ? ({ ...l, ...patch } as Layer) : l)),
                  }
                : sc,
            ),
          }),
        })),

      reorderLayer: (sceneId, layerId, direction) =>
        set((s) => ({
          project: touch({
            ...s.project,
            scenes: s.project.scenes.map((sc) => {
              if (sc.id !== sceneId) return sc;
              const idx = sc.layers.findIndex((l) => l.id === layerId);
              const target = idx + direction;
              if (idx < 0 || target < 0 || target >= sc.layers.length) return sc;
              const layers = [...sc.layers];
              const [m] = layers.splice(idx, 1);
              layers.splice(target, 0, m);
              return { ...sc, layers };
            }),
          }),
        })),

      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      setPreviewTime: (t) => set({ previewTime: t }),
    }),
    {
      name: "bookjunkaway-meta-ad-studio",
      partialize: (s) => ({ project: s.project }),
      version: 1,
    },
  ),
);

export function totalDuration(project: Project): number {
  return project.scenes.reduce((sum, sc) => sum + sc.duration, 0);
}

export function sceneAtTime(project: Project, t: number): { scene: Scene; localTime: number; index: number } | null {
  let acc = 0;
  for (let i = 0; i < project.scenes.length; i++) {
    const sc = project.scenes[i];
    if (t < acc + sc.duration) {
      return { scene: sc, localTime: t - acc, index: i };
    }
    acc += sc.duration;
  }
  const last = project.scenes[project.scenes.length - 1];
  return last ? { scene: last, localTime: last.duration, index: project.scenes.length - 1 } : null;
}
