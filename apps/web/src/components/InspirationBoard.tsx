"use client";

import { useState } from "react";

type InspirationItem = {
  id: string;
  type: string;
  content: string;
  notes: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  HOOK: "Hook",
  TITLE: "Titre",
  FORMAT: "Format de montage",
  REFERENCE: "Référence",
  TONE_GUIDELINE: "Consigne de ton",
  WORD_TO_AVOID: "Mot à éviter",
  TEMPLATE: "Template",
  BRAND_PREFERENCE: "Préférence de marque",
};

export function InspirationBoard({ initialItems }: { initialItems: InspirationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [type, setType] = useState("HOOK");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/inspiration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content, notes: notes || undefined }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setItems((prev) => [data.item, ...prev]);
    setContent("");
    setNotes("");
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/inspiration/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <form onSubmit={addItem} className="card grid gap-3 p-4 sm:grid-cols-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input sm:col-span-2"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <textarea
          required
          placeholder="Contenu (ex: le hook, le titre, la référence...)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="input sm:col-span-2"
        />
        <input
          placeholder="Notes (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input sm:col-span-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50 sm:col-span-2 sm:w-fit"
        >
          {loading ? "Ajout..." : "Ajouter à la base d'inspiration"}
        </button>
      </form>

      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="badge bg-brand-50 text-brand-700">
                  {TYPE_LABELS[item.type] ?? item.type}
                </span>
                <p className="mt-2 text-slate-900">{item.content}</p>
                {item.notes && <p className="mt-1 text-sm text-slate-500">{item.notes}</p>}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-sm text-slate-400 hover:text-red-600"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
