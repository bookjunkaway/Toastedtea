"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, ExternalLink, Mail, MessageSquare, Plus, Trash2, Users } from "lucide-react";
import { ClientRecord, buildPitch, useClients } from "@/lib/clients";
import { useEditor } from "@/lib/store";
import { proofUrl } from "@/lib/proof";

export function ClientPanel() {
  const clients = useClients((s) => s.clients);
  const activeId = useClients((s) => s.activeClientId);
  const setActive = useClients((s) => s.setActive);
  const upsert = useClients((s) => s.upsertClient);
  const remove = useClients((s) => s.deleteClient);
  const project = useEditor((s) => s.project);
  const [copied, setCopied] = useState<string | null>(null);

  const active = clients.find((c) => c.id === activeId);

  const loadIntoProject = (c: ClientRecord) => {
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

  const copy = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const url = active ? proofUrl(project, active.id) : "";
  const pitch = active ? buildPitch(active, project, url) : null;

  return (
    <div className="space-y-3 text-sm">
      <div className="panel p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="label flex items-center gap-1">
            <Users className="size-3 text-brand" /> Client roster
          </div>
          <div className="flex gap-1">
            <Link href="/clients" className="btn-ghost h-7 px-2 text-[11px]">
              Manage
            </Link>
            <button
              onClick={() => {
                const c = upsert({});
                setActive(c.id);
              }}
              className="btn-ghost h-7 px-2 text-[11px]"
            >
              <Plus className="size-3" /> Add
            </button>
          </div>
        </div>
        {clients.length === 0 ? (
          <p className="text-xs text-white/50">
            No clients yet. Add one to swap their brand into the current ad and generate a proof link
            you can sell to them.
          </p>
        ) : (
          <ul className="space-y-1 max-h-40 overflow-auto pr-1">
            {clients.map((c) => (
              <li
                key={c.id}
                className={`flex items-center justify-between gap-2 rounded px-2 py-1 cursor-pointer ${
                  c.id === activeId ? "bg-brand/15 ring-1 ring-brand/40" : "hover:bg-white/5"
                }`}
                onClick={() => setActive(c.id)}
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.brand.companyName}</div>
                  <div className="text-[10px] text-white/40 truncate">
                    {c.industry} · {c.stage}
                  </div>
                </div>
                <button
                  className="text-white/40 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(c.id);
                  }}
                  aria-label="Delete client"
                >
                  <Trash2 className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {active && (
        <>
          <div className="panel p-3 space-y-2">
            <div className="label">Edit · {active.brand.companyName}</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="Company"
                value={active.brand.companyName}
                onChange={(e) => upsert({ id: active.id, brand: { ...active.brand, companyName: e.target.value } })}
              />
              <input
                className="input"
                placeholder="Industry"
                value={active.industry}
                onChange={(e) => upsert({ id: active.id, industry: e.target.value })}
              />
              <input
                className="input"
                placeholder="Website"
                value={active.brand.website}
                onChange={(e) => upsert({ id: active.id, brand: { ...active.brand, website: e.target.value } })}
              />
              <input
                className="input"
                placeholder="Phone"
                value={active.brand.phone}
                onChange={(e) => upsert({ id: active.id, brand: { ...active.brand, phone: e.target.value } })}
              />
              <input
                className="input"
                placeholder="Contact name"
                value={active.contactName}
                onChange={(e) => upsert({ id: active.id, contactName: e.target.value })}
              />
              <input
                className="input"
                placeholder="Contact email"
                value={active.contactEmail}
                onChange={(e) => upsert({ id: active.id, contactEmail: e.target.value })}
              />
              <input
                className="input col-span-2"
                placeholder="Offer / promo"
                value={active.brand.offer}
                onChange={(e) => upsert({ id: active.id, brand: { ...active.brand, offer: e.target.value } })}
              />
              <select
                className="input"
                value={active.stage}
                onChange={(e) => upsert({ id: active.id, stage: e.target.value as ClientRecord["stage"] })}
              >
                {(["lead", "pitched", "proof-sent", "won", "lost"] as ClientRecord["stage"][]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input"
                placeholder="Price ($)"
                value={active.proposedPrice}
                onChange={(e) => upsert({ id: active.id, proposedPrice: parseInt(e.target.value || "0", 10) })}
              />
            </div>
            <button className="btn-primary w-full" onClick={() => loadIntoProject(active)}>
              Swap brand into current ad
            </button>
          </div>

          <div className="panel p-3 space-y-2">
            <div className="label flex items-center gap-1">
              <ExternalLink className="size-3 text-brand" /> Proof link (share with client)
            </div>
            <textarea readOnly value={url} className="input min-h-[60px] text-[10px] break-all" />
            <button className="btn-ghost w-full" onClick={() => copy("link", url)}>
              <Copy className="size-3" /> {copied === "link" ? "Copied!" : "Copy link"}
            </button>
            <a className="btn-ghost w-full" href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3" /> Open preview
            </a>
          </div>

          {pitch && (
            <div className="panel p-3 space-y-2">
              <div className="label">Pitch templates</div>
              <details className="rounded-md bg-white/5 px-2 py-1.5">
                <summary className="cursor-pointer text-[12px] font-semibold flex items-center gap-2">
                  <Mail className="size-3 text-brand" /> Email (subject + body)
                </summary>
                <div className="mt-1">
                  <input className="input mb-1 text-[11px]" readOnly value={pitch.subject} />
                  <textarea className="input text-[11px] min-h-[160px]" readOnly value={pitch.email} />
                  <button className="btn-ghost w-full mt-1" onClick={() => copy("email", `Subject: ${pitch.subject}\n\n${pitch.email}`)}>
                    <Copy className="size-3" /> {copied === "email" ? "Copied!" : "Copy email"}
                  </button>
                </div>
              </details>
              <details className="rounded-md bg-white/5 px-2 py-1.5">
                <summary className="cursor-pointer text-[12px] font-semibold flex items-center gap-2">
                  <MessageSquare className="size-3 text-brand" /> SMS / text
                </summary>
                <div className="mt-1">
                  <textarea className="input text-[11px] min-h-[80px]" readOnly value={pitch.sms} />
                  <button className="btn-ghost w-full mt-1" onClick={() => copy("sms", pitch.sms)}>
                    <Copy className="size-3" /> {copied === "sms" ? "Copied!" : "Copy SMS"}
                  </button>
                </div>
              </details>
              <details className="rounded-md bg-white/5 px-2 py-1.5">
                <summary className="cursor-pointer text-[12px] font-semibold flex items-center gap-2">
                  <MessageSquare className="size-3 text-brand" /> LinkedIn DM
                </summary>
                <div className="mt-1">
                  <textarea className="input text-[11px] min-h-[100px]" readOnly value={pitch.linkedin} />
                  <button className="btn-ghost w-full mt-1" onClick={() => copy("li", pitch.linkedin)}>
                    <Copy className="size-3" /> {copied === "li" ? "Copied!" : "Copy LinkedIn DM"}
                  </button>
                </div>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
}
