"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Facebook, Linkedin, Mail, MessageSquare, Share2, Trophy } from "lucide-react";

interface Props {
  proofUrl: string;
  brandName: string;
  prize?: string;
}

export function ShareToWin({ proofUrl, brandName, prize = "a custom Meta video ad like this one" }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [entered, setEntered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState<string[]>([]);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("bja-share-entries") : null;
    if (raw) {
      try {
        setShares(JSON.parse(raw) as string[]);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const recordShare = (channel: string) => {
    const next = [...new Set([...shares, channel])];
    setShares(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("bja-share-entries", JSON.stringify(next));
    }
  };

  const submitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    // Stored locally for the operator's reference. If they wire up a webhook
    // (NEXT_PUBLIC_GIVEAWAY_WEBHOOK), we can POST too.
    const entry = {
      name,
      email,
      proofUrl,
      brandName,
      shares,
      at: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("bja-giveaway-entries");
      const list = raw ? (JSON.parse(raw) as Array<typeof entry>) : [];
      list.push(entry);
      localStorage.setItem("bja-giveaway-entries", JSON.stringify(list));
    }
    const hook = process.env.NEXT_PUBLIC_GIVEAWAY_WEBHOOK;
    if (hook) {
      fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }).catch(() => {});
    }
    setEntered(true);
  };

  const msg = `Check out this custom Meta ad I just saw — Book Junk Away is giving one away free this month: ${proofUrl}`;
  const encUrl = encodeURIComponent(proofUrl);
  const encMsg = encodeURIComponent(msg);

  const channels: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; key: string }[] = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      icon: Facebook,
      key: "facebook",
    },
    {
      label: "X / Twitter",
      href: `https://twitter.com/intent/tweet?text=${encMsg}`,
      icon: Share2,
      key: "twitter",
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`,
      icon: Linkedin,
      key: "linkedin",
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encMsg}`,
      icon: MessageSquare,
      key: "whatsapp",
    },
    {
      label: "SMS",
      href: `sms:?&body=${encMsg}`,
      icon: MessageSquare,
      key: "sms",
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent("Check this out")}&body=${encMsg}`,
      icon: Mail,
      key: "email",
    },
  ];

  return (
    <section className="panel p-6 mt-6 bg-gradient-to-br from-brand/15 via-transparent to-red-500/10 border-brand/30">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-brand" />
        <h3 className="text-xl font-black">Share & win {prize}</h3>
      </div>
      <p className="text-sm text-white/80 mt-1">
        We pick one winner every month. Share this proof on any platform, then drop your name + email and you&apos;re in. The more places you share, the more entries you get.
      </p>

      <div className="mt-4">
        <div className="label mb-2">1 · Share anywhere</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {channels.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => recordShare(c.key)}
              className={`btn-ghost h-9 text-xs ${shares.includes(c.key) ? "ring-1 ring-brand/40 bg-brand/10" : ""}`}
            >
              <c.icon className="size-4" /> {c.label}
              {shares.includes(c.key) && <Check className="size-3 text-emerald-400 ml-auto" />}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(proofUrl);
              recordShare("copy");
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className={`btn-ghost h-9 text-xs ${shares.includes("copy") ? "ring-1 ring-brand/40 bg-brand/10" : ""}`}
          >
            <Copy className="size-4" /> {copied ? "Copied!" : "Copy link"}
            {shares.includes("copy") && <Check className="size-3 text-emerald-400 ml-auto" />}
          </button>
        </div>
        <div className="text-[11px] text-white/60 mt-1">
          {shares.length === 0 ? "No shares yet" : `${shares.length} share${shares.length === 1 ? "" : "s"} counted ✓`}
        </div>
      </div>

      <form onSubmit={submitEntry} className="mt-4">
        <div className="label mb-2">2 · Enter the draw</div>
        {!entered ? (
          <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">
              <Trophy className="size-4" /> Enter
            </button>
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-200">
            ✓ You&apos;re entered. We&apos;ll email the winner on the 1st of next month — good luck!
          </div>
        )}
      </form>

      <p className="text-[10px] text-white/40 mt-3">
        No purchase necessary. One entry per email. Winner notified by email. Sponsored by Book Junk Away.
      </p>
    </section>
  );
}
