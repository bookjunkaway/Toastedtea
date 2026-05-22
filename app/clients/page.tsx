"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Wand2 } from "lucide-react";
import { ClientRecord, useClients } from "@/lib/clients";
import { useEditor } from "@/lib/store";

const STAGES: ClientRecord["stage"][] = ["lead", "pitched", "proof-sent", "won", "lost"];

export default function ClientsPage() {
  const clients = useClients((s) => s.clients);
  const upsert = useClients((s) => s.upsertClient);
  const remove = useClients((s) => s.deleteClient);
  const setActive = useClients((s) => s.setActive);
  const [filter, setFilter] = useState<ClientRecord["stage"] | "all">("all");

  const filtered = filter === "all" ? clients : clients.filter((c) => c.stage === filter);
  const totalWon = clients.filter((c) => c.stage === "won").reduce((a, b) => a + b.proposedPrice, 0);
  const pipelineValue = clients
    .filter((c) => c.stage === "proof-sent" || c.stage === "pitched")
    .reduce((a, b) => a + b.proposedPrice, 0);

  const swap = (c: ClientRecord) => {
    useEditor.setState((s) => ({
      project: {
        ...s.project,
        brand: { ...s.project.brand, ...c.brand },
        palette: { ...s.project.palette, ...c.palette },
        updatedAt: Date.now(),
      },
    }));
    setActive(c.id);
  };

  return (
    <main className="min-h-screen mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <Link href="/editor" className="btn-ghost h-8 mb-3">
            <ArrowLeft className="size-4" /> Back to studio
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Client Pipeline</h1>
          <p className="text-white/60 mt-1 max-w-2xl">
            Save any company's brand, swap it into your current ad, and sell
            them a proof in minutes. Track leads, pitches, and wins here.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="panel px-4 py-2 text-center">
            <div className="text-[10px] uppercase text-white/40">Pipeline value</div>
            <div className="font-black text-lg">${pipelineValue.toLocaleString()}</div>
          </div>
          <div className="panel px-4 py-2 text-center">
            <div className="text-[10px] uppercase text-emerald-400">Won</div>
            <div className="font-black text-lg text-emerald-300">${totalWon.toLocaleString()}</div>
          </div>
          <button onClick={() => upsert({})} className="btn-primary">
            <Plus className="size-4" /> Add client
          </button>
        </div>
      </header>

      <div className="flex gap-1 mb-4 flex-wrap">
        {(["all", ...STAGES] as const).map((s) => {
          const count = s === "all" ? clients.length : clients.filter((c) => c.stage === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn-ghost h-8 text-xs ${filter === s ? "ring-1 ring-brand/60 bg-brand/10" : ""}`}
            >
              {s} · {count}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => (
          <div key={c.id} className="panel p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-black text-base">{c.brand.companyName}</div>
                <div className="text-[11px] text-white/50">
                  {c.industry} · {c.brand.website}
                </div>
              </div>
              <button
                onClick={() => remove(c.id)}
                className="text-white/40 hover:text-red-400"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <input
              className="input"
              placeholder="Company"
              value={c.brand.companyName}
              onChange={(e) => upsert({ id: c.id, brand: { ...c.brand, companyName: e.target.value } })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="Website"
                value={c.brand.website}
                onChange={(e) => upsert({ id: c.id, brand: { ...c.brand, website: e.target.value } })}
              />
              <input
                className="input"
                placeholder="Phone"
                value={c.brand.phone}
                onChange={(e) => upsert({ id: c.id, brand: { ...c.brand, phone: e.target.value } })}
              />
              <input
                className="input"
                placeholder="Contact name"
                value={c.contactName}
                onChange={(e) => upsert({ id: c.id, contactName: e.target.value })}
              />
              <input
                className="input"
                placeholder="Contact email"
                value={c.contactEmail}
                onChange={(e) => upsert({ id: c.id, contactEmail: e.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="Tagline"
              value={c.brand.tagline}
              onChange={(e) => upsert({ id: c.id, brand: { ...c.brand, tagline: e.target.value } })}
            />
            <input
              className="input"
              placeholder="Offer"
              value={c.brand.offer}
              onChange={(e) => upsert({ id: c.id, brand: { ...c.brand, offer: e.target.value } })}
            />
            <textarea
              className="input min-h-[60px]"
              placeholder="Notes"
              value={c.notes}
              onChange={(e) => upsert({ id: c.id, notes: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                className="input"
                value={c.stage}
                onChange={(e) => upsert({ id: c.id, stage: e.target.value as ClientRecord["stage"] })}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input"
                placeholder="Price"
                value={c.proposedPrice}
                onChange={(e) => upsert({ id: c.id, proposedPrice: parseInt(e.target.value || "0", 10) })}
              />
            </div>

            <Link
              href="/editor"
              onClick={() => swap(c)}
              className="btn-primary w-full"
            >
              <Wand2 className="size-4" /> Swap brand into ad
            </Link>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-white/50 col-span-full text-sm">No clients in this stage yet.</p>
        )}
      </div>
    </main>
  );
}
