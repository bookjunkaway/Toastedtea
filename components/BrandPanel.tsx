"use client";

import { useEditor } from "@/lib/store";
import { BrandInputs, COMMON_CATEGORIES } from "@/lib/types";

export function BrandPanel() {
  const brand = useEditor((s) => s.project.brand);
  const palette = useEditor((s) => s.project.palette);
  const updateBrand = useEditor((s) => s.updateBrand);

  const field = (key: keyof BrandInputs, label: string, placeholder?: string, type: "text" | "textarea" = "text") => {
    const v = (brand[key] ?? "") as string | number;
    return (
      <div>
        <div className="label mb-1">{label}</div>
        {type === "textarea" ? (
          <textarea
            className="input min-h-[60px]"
            placeholder={placeholder}
            value={v as string}
            onChange={(e) => updateBrand({ [key]: e.target.value } as Partial<BrandInputs>)}
          />
        ) : (
          <input
            className="input"
            placeholder={placeholder}
            value={v as string}
            onChange={(e) => updateBrand({ [key]: e.target.value } as Partial<BrandInputs>)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="panel p-3 space-y-3">
      <div className="label">Brand</div>
      <div className="grid grid-cols-2 gap-2">
        {field("companyName", "Company")}
        {field("phone", "Phone")}
      </div>
      <div>
        <div className="label mb-1">Category / industry</div>
        <select
          className="input"
          value={brand.category}
          onChange={(e) => updateBrand({ category: e.target.value })}
        >
          {COMMON_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="text-[10px] text-white/40 mt-1">
          Drives the AI prompt&apos;s tone + copy. Switch to anything — Plumbing, Cleaning, Salon, Restaurant, Real Estate, etc.
        </div>
      </div>
      {field("tagline", "Tagline")}
      {field("website", "Website")}
      {field("serviceArea", "Service area")}
      {field("offer", "Offer / promo")}
      {field("cta", "Call to action")}
      <div className="grid grid-cols-2 gap-2">
        {field("reviewerName", "Reviewer name")}
        <div>
          <div className="label mb-1">Rating</div>
          <input
            className="input"
            type="number"
            min={1}
            max={5}
            value={brand.rating}
            onChange={(e) => updateBrand({ rating: parseInt(e.target.value || "5", 10) })}
          />
        </div>
      </div>
      {field("reviewQuote", "Review quote", undefined, "textarea")}
      <div className="grid grid-cols-3 gap-2">
        {field("heroImage", "Hero image src", "/logo.svg or data:image/...")}
        {field("beforeImage", "Before img src", "data:image/...")}
        {field("afterImage", "After img src", "data:image/...")}
      </div>

      <div className="pt-2 border-t border-white/10">
        <div className="label mb-2">Palette</div>
        <div className="grid grid-cols-5 gap-2">
          {(["primary", "secondary", "accent", "surface", "onSurface"] as const).map((k) => (
            <div key={k}>
              <div className="label mb-1">{k}</div>
              <input
                type="color"
                value={palette[k]}
                onChange={(e) =>
                  useEditor.setState((s) => ({
                    project: { ...s.project, palette: { ...s.project.palette, [k]: e.target.value }, updatedAt: Date.now() },
                  }))
                }
                className="h-9 w-full rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
