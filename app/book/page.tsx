"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Loader2,
  PartyPopper,
  Phone,
  Scale,
} from "lucide-react";
import { useLeads } from "@/lib/leads";
import { track } from "@/lib/analytics";

/* ──────────────────────────────────────────────────────────────────────────
 *  "Build your haul" instant-quote booking flow (customer-facing).
 *
 *  Pick items → live weight-based estimate → book. Submissions land in the
 *  same local CRM as ad leads (useLeads) and email the operator via
 *  /api/notify-lead. Pricing is weight-driven with a stair surcharge and a
 *  minimum charge.
 * ────────────────────────────────────────────────────────────────────────── */

const PER_POUND = 0.54;
const MIN_CHARGE = 150;
const STAIR_FEE = 50;
const COMPANY_PHONE = "(727) 288-4847";

const NEIGHBORHOODS = [
  "South Tampa", "Hyde Park", "Ybor City", "Seminole Heights", "Carrollwood",
  "New Tampa", "Palma Ceia", "Davis Islands", "Riverview", "Brandon", "Westchase", "Channelside",
] as const;

const HAULERS = [
  { emoji: "👷", name: "Mike" },
  { emoji: "🧑‍🔧", name: "Ray" },
  { emoji: "👩‍🔧", name: "Dana" },
  { emoji: "🧔", name: "Carlos" },
  { emoji: "👩", name: "Jess" },
  { emoji: "🧑‍🦱", name: "Devon" },
] as const;

type Category = "Living Room" | "Kitchen" | "Bedroom" | "Garage" | "Appliances" | "Outdoor";

interface Item {
  id: string;
  emoji: string;
  name: string;
  lbs: number;
  cat: Category;
}

const ITEMS: Item[] = [
  { id: "s1", emoji: "🛋️", name: "3-Cushion Sofa", lbs: 220, cat: "Living Room" },
  { id: "s2", emoji: "🪑", name: "Armchair", lbs: 85, cat: "Living Room" },
  { id: "s3", emoji: "🪑", name: "Recliner", lbs: 105, cat: "Living Room" },
  { id: "s4", emoji: "🪵", name: "Coffee Table", lbs: 65, cat: "Living Room" },
  { id: "s5", emoji: "📺", name: "65\" Smart TV", lbs: 72, cat: "Living Room" },
  { id: "s6", emoji: "📚", name: "Bookshelf", lbs: 95, cat: "Living Room" },
  { id: "s7", emoji: "🟫", name: "Area Rug 8x10", lbs: 55, cat: "Living Room" },
  { id: "s8", emoji: "💡", name: "Floor Lamp", lbs: 18, cat: "Living Room" },
  { id: "k1", emoji: "🧊", name: "Refrigerator", lbs: 300, cat: "Kitchen" },
  { id: "k2", emoji: "🍳", name: "Gas Range", lbs: 180, cat: "Kitchen" },
  { id: "k3", emoji: "🧼", name: "Dishwasher", lbs: 110, cat: "Kitchen" },
  { id: "k4", emoji: "📦", name: "Microwave", lbs: 35, cat: "Kitchen" },
  { id: "k5", emoji: "🪵", name: "Kitchen Table", lbs: 85, cat: "Kitchen" },
  { id: "k6", emoji: "🪑", name: "Chairs (set of 4)", lbs: 60, cat: "Kitchen" },
  { id: "b1", emoji: "🛏️", name: "King Bed Frame", lbs: 180, cat: "Bedroom" },
  { id: "b2", emoji: "🛌", name: "King Mattress", lbs: 150, cat: "Bedroom" },
  { id: "b3", emoji: "🗄️", name: "Dresser (6-drawer)", lbs: 140, cat: "Bedroom" },
  { id: "b4", emoji: "🗄️", name: "Nightstands (pair)", lbs: 60, cat: "Bedroom" },
  { id: "b5", emoji: "🚪", name: "Wardrobe Armoire", lbs: 220, cat: "Bedroom" },
  { id: "b6", emoji: "🪞", name: "Full-Length Mirror", lbs: 35, cat: "Bedroom" },
  { id: "g1", emoji: "🛠️", name: "Workbench", lbs: 200, cat: "Garage" },
  { id: "g2", emoji: "🚲", name: "Bicycle", lbs: 25, cat: "Garage" },
  { id: "g3", emoji: "🏋️", name: "Weight Set", lbs: 300, cat: "Garage" },
  { id: "g4", emoji: "🌿", name: "Lawn Mower", lbs: 90, cat: "Garage" },
  { id: "g5", emoji: "📦", name: "Storage Boxes (10pk)", lbs: 120, cat: "Garage" },
  { id: "a1", emoji: "🧺", name: "Washer", lbs: 170, cat: "Appliances" },
  { id: "a2", emoji: "🌀", name: "Dryer", lbs: 130, cat: "Appliances" },
  { id: "a3", emoji: "❄️", name: "Window AC Unit", lbs: 80, cat: "Appliances" },
  { id: "a4", emoji: "🌡️", name: "Water Heater", lbs: 150, cat: "Appliances" },
  { id: "o1", emoji: "🪑", name: "Patio Set (4pc)", lbs: 120, cat: "Outdoor" },
  { id: "o2", emoji: "🔥", name: "Gas Grill", lbs: 95, cat: "Outdoor" },
  { id: "o3", emoji: "🛖", name: "Storage Shed", lbs: 400, cat: "Outdoor" },
  { id: "o4", emoji: "🌊", name: "Hot Tub", lbs: 800, cat: "Outdoor" },
];

const CATS = ["All", "Living Room", "Kitchen", "Bedroom", "Garage", "Appliances", "Outdoor"] as const;

const TIME_WINDOWS = ["Morning (8am–12pm)", "Afternoon (12pm–4pm)", "Evening (4pm–7pm)"] as const;

type Screen = "intro" | "build" | "review" | "done";

const itemById = (id: string) => ITEMS.find((i) => i.id === id)!;

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/** Derive a lead-store urgency bucket from the requested pickup date. */
function urgencyFromDate(date: string): "asap" | "this-week" | "this-month" | "browsing" {
  if (!date) return "browsing";
  const days = (new Date(date + "T00:00:00").getTime() - Date.now()) / 86_400_000;
  if (days <= 1) return "asap";
  if (days <= 7) return "this-week";
  if (days <= 31) return "this-month";
  return "browsing";
}

export default function BookPage() {
  const recordSubmission = useLeads((s) => s.recordSubmission);
  const notifyEmail = useLeads((s) => s.notifyEmail);

  const [screen, setScreen] = useState<Screen>("intro");
  const [hauler, setHauler] = useState<(typeof HAULERS)[number] | null>(null);
  const [hood, setHood] = useState<string>(NEIGHBORHOODS[0]);
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [stairs, setStairs] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", date: "", time: TIME_WINDOWS[0] as string });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{ ref: string; total: number } | null>(null);

  const lines = useMemo(
    () => Object.entries(qty).filter(([, q]) => q > 0).map(([id, q]) => ({ item: itemById(id), q })),
    [qty],
  );
  const itemCount = lines.reduce((s, l) => s + l.q, 0);
  const totalLbs = lines.reduce((s, l) => s + l.item.lbs * l.q, 0);
  const stairCost = stairs * STAIR_FEE;
  const total = itemCount > 0 ? Math.max(totalLbs * PER_POUND + stairCost, MIN_CHARGE) : 0;
  const atMinimum = itemCount > 0 && totalLbs * PER_POUND + stairCost < MIN_CHARGE;

  const visibleItems = cat === "All" ? ITEMS : ITEMS.filter((i) => i.cat === cat);

  const setItemQty = (id: string, delta: number) =>
    setQty((q) => {
      const next = Math.max(0, (q[id] ?? 0) + delta);
      const copy = { ...q };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  function reset() {
    setScreen("intro");
    setHauler(null);
    setQty({});
    setStairs(0);
    setError("");
    setConfirmation(null);
    setForm({ name: "", email: "", phone: "", address: "", date: "", time: TIME_WINDOWS[0] });
  }

  async function submit() {
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Please add your name, phone, and pickup address.");
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      setError("That email doesn't look right.");
      return;
    }
    setSubmitting(true);
    try {
      const ref = "BJA-" + uidRef();
      const haulList = lines.map((l) => `${l.item.emoji} ${l.item.name}${l.q > 1 ? ` ×${l.q}` : ""} (${l.item.lbs * l.q} lbs)`).join("\n");
      const notes = [
        `HAUL (${itemCount} item${itemCount === 1 ? "" : "s"}, ~${totalLbs} lbs)`,
        haulList,
        stairs > 0 ? `Stairs: ${stairs} flight${stairs === 1 ? "" : "s"} (+$${stairCost})` : null,
        `Neighborhood: ${hood}`,
        `Pickup: ${form.date || "flexible"} · ${form.time}`,
        hauler ? `Requested hauler: ${hauler.emoji} ${hauler.name}` : null,
        `Quoted estimate: $${total.toFixed(2)}`,
        `Ref: ${ref}`,
      ]
        .filter(Boolean)
        .join("\n");

      const payload = {
        formId: ref,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: `${form.address.trim()}, ${hood}`,
        jobType: `Junk removal — ${itemCount} item${itemCount === 1 ? "" : "s"} (~${totalLbs} lbs)`,
        urgency: urgencyFromDate(form.date),
        notes,
        source: {
          companyName: "Book Junk Away",
          category: "Junk Removal",
          offer: `$${total.toFixed(0)} instant quote`,
        },
      };

      recordSubmission(payload);
      track({ adId: ref, event: "submit", meta: { items: itemCount, lbs: totalLbs, total: Math.round(total) } });

      const to = notifyEmail || process.env.NEXT_PUBLIC_NOTIFY_EMAIL;
      if (to) {
        fetch("/api/notify-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, payload }),
        }).catch(() => {});
      }

      setConfirmation({ ref, total });
      setScreen("done");
    } catch {
      setError("Something went wrong saving your booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[100dvh] mx-auto flex max-w-md flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand/15 bg-black/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-black text-brand">
          <Truck className="size-4" /> Book Junk Away
        </div>
        {screen === "build" ? (
          <div className="text-sm font-black text-brand">${total.toFixed(0)} est.</div>
        ) : (
          <Link href="/" className="text-xs text-white/50 hover:text-white">
            Home
          </Link>
        )}
      </header>

      {/* Intro */}
      {screen === "intro" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight">
            BOOK
            <br />
            <span className="text-brand">JUNK</span>
            <br />
            AWAY
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-white/55">
            Tampa Bay junk removal. Pick your items, get an instant weight-based price, and book in
            minutes.
          </p>

          <div className="flex gap-3">
            {[
              ["54¢", "per pound"],
              ["$150", "minimum"],
              ["7 days", "a week"],
            ].map(([n, l]) => (
              <div key={l} className="panel px-4 py-3">
                <div className="text-xl font-black text-brand">{n}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/45">{l}</div>
              </div>
            ))}
          </div>

          <div className="w-full">
            <div className="label mb-2 text-left">Choose your hauler</div>
            <div className="grid grid-cols-3 gap-2">
              {HAULERS.map((h) => {
                const active = hauler?.name === h.name;
                return (
                  <button
                    key={h.name}
                    onClick={() => setHauler(h)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors ${
                      active ? "border-brand bg-brand/10" : "border-white/10 bg-white/[0.03] hover:bg-white/5"
                    }`}
                  >
                    <span className="text-3xl">{h.emoji}</span>
                    <span className="text-xs font-bold text-white/70">{h.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button className="btn-primary w-full py-4 text-base" onClick={() => setScreen("build")}>
            <Truck className="size-4" /> Start hauling
          </button>
        </section>
      )}

      {/* Build */}
      {screen === "build" && (
        <section className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-brand/10 bg-brand/[0.04] px-4 py-2.5">
            <MapPin className="size-4 text-brand" />
            <select
              aria-label="Neighborhood"
              className="flex-1 cursor-pointer bg-transparent text-sm font-bold text-brand outline-none"
              value={hood}
              onChange={(e) => setHood(e.target.value)}
            >
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n} className="bg-ink-950">
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  cat === c ? "bg-brand text-ink-950" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2.5 overflow-y-auto px-4 pb-4">
            {visibleItems.map((item) => {
              const q = qty[item.id] ?? 0;
              const selected = q > 0;
              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-1.5 rounded-xl border p-3 transition-colors ${
                    selected ? "border-brand bg-brand/10" : "border-white/[0.07] bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{item.emoji}</span>
                    {selected && <span className="rounded-full bg-brand px-1.5 text-xs font-black text-ink-950">×{q}</span>}
                  </div>
                  <div className="text-[13px] font-bold leading-tight">{item.name}</div>
                  <div className="text-[11px] text-white/40">{item.lbs} lbs</div>
                  <div className="text-sm font-black text-brand">${(item.lbs * PER_POUND).toFixed(0)}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      onClick={() => setItemQty(item.id, -1)}
                      disabled={!selected}
                      aria-label={`Remove one ${item.name}`}
                      className="flex size-7 items-center justify-center rounded-md bg-white/10 text-white disabled:opacity-30"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-4 flex-1 text-center text-sm font-bold">{q}</span>
                    <button
                      onClick={() => setItemQty(item.id, 1)}
                      aria-label={`Add one ${item.name}`}
                      className="flex size-7 items-center justify-center rounded-md bg-brand text-ink-950"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 border-t border-white/[0.07] px-4 py-2.5">
            <span className="flex-1 text-xs text-white/55">
              🪜 Stair flights <strong className="text-brand">{stairs}</strong> (+${stairCost})
            </span>
            <button
              onClick={() => setStairs((s) => Math.max(0, s - 1))}
              aria-label="Fewer stair flights"
              className="flex size-8 items-center justify-center rounded-lg bg-white/10"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-5 text-center text-sm font-black text-brand">{stairs}</span>
            <button
              onClick={() => setStairs((s) => s + 1)}
              aria-label="More stair flights"
              className="flex size-8 items-center justify-center rounded-lg bg-white/10"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {itemCount > 0 && (
            <button
              className="btn-primary mx-4 mb-4 py-4 text-sm"
              onClick={() => setScreen("review")}
            >
              <ShoppingCart className="size-4" /> {itemCount} item{itemCount === 1 ? "" : "s"} · ${total.toFixed(0)} → Review
            </button>
          )}
        </section>
      )}

      {/* Review */}
      {screen === "review" && (
        <section className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
          <div>
            <h2 className="text-2xl font-black">Your estimate</h2>
            <p className="text-sm text-white/45">Review your haul and lock in a pickup.</p>
          </div>

          <div className="panel space-y-2 p-4">
            {lines.map((l) => (
              <div key={l.item.id} className="flex items-center justify-between text-sm">
                <span className="text-white/80">
                  {l.item.emoji} {l.item.name}
                  {l.q > 1 && <span className="text-white/40"> ×{l.q}</span>}
                </span>
                <span className="font-bold text-brand">${(l.item.lbs * l.q * PER_POUND).toFixed(0)}</span>
              </div>
            ))}
            {stairs > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">🪜 Stair fee ({stairs} flight{stairs === 1 ? "" : "s"})</span>
                <span className="font-bold text-brand">${stairCost}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Scale className="size-3.5" /> Total weight
              </span>
              <span>{totalLbs} lbs ({(totalLbs / 2000).toFixed(2)} tons)</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
              <span className="text-sm font-bold">Total estimate</span>
              <span className="text-2xl font-black text-brand">${total.toFixed(2)}</span>
            </div>
            {atMinimum && (
              <p className="text-[11px] text-white/40">$150 minimum applied — add more and the price stays the same up to 277 lbs.</p>
            )}
          </div>

          <div className="space-y-3">
            {([
              ["Name", "text", "Your full name", "name", true],
              ["Phone", "tel", "(813) 555-0000", "phone", true],
              ["Email", "email", "you@email.com", "email", false],
              ["Pickup address", "text", "Street address", "address", true],
              ["Pickup date", "date", "", "date", false],
            ] as const).map(([label, type, ph, key, required]) => (
              <div key={key}>
                <label className="label mb-1.5 block">
                  {label} {required && <span className="text-brand">*</span>}
                </label>
                <input
                  className="input"
                  type={type}
                  placeholder={ph}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="label mb-1.5 block">Time window</label>
              <select
                className="input"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              >
                {TIME_WINDOWS.map((t) => (
                  <option key={t} value={t} className="bg-ink-950">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button className="btn-primary py-4 text-base" onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-5 animate-spin" /> : <Truck className="size-4" />}
            {submitting ? "Booking…" : "Confirm my haul"}
          </button>
          <button className="btn-ghost py-3" onClick={() => setScreen("build")} disabled={submitting}>
            <ArrowLeft className="size-4" /> Edit items
          </button>
        </section>
      )}

      {/* Done */}
      {screen === "done" && confirmation && (
        <section className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <PartyPopper className="size-16 text-brand" />
          <div className="text-xs uppercase tracking-[0.2em] text-white/35">{confirmation.ref}</div>
          <h2 className="text-3xl font-black">You&apos;re booked!</h2>
          <div className="text-4xl font-black text-brand">${confirmation.total.toFixed(2)}</div>
          <p className="text-sm leading-relaxed text-white/55">
            {hauler ? `${hauler.emoji} ${hauler.name} and the` : "The"} crew will call within 2 hours
            to confirm your {hood} pickup.
          </p>
          <a href={`tel:${COMPANY_PHONE.replace(/[^0-9+]/g, "")}`} className="btn-ghost w-full py-3">
            <Phone className="size-4 text-brand" /> {COMPANY_PHONE}
          </a>
          <button className="btn-primary w-full py-4 text-base" onClick={reset}>
            Start a new estimate
          </button>
        </section>
      )}
    </main>
  );
}

/** Short human-friendly booking reference (6 chars, base36). */
function uidRef(): string {
  return (Date.now().toString(36).slice(-3) + Math.random().toString(36).slice(2, 5)).toUpperCase();
}
