const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  DOWNLOADING: "Téléchargement",
  TRANSCRIBING: "Transcription",
  ANALYZING: "Analyse",
  EDITING: "Montage",
  EXPORTING: "Export",
  READY: "Prêt",
  FAILED: "Échec",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  DOWNLOADING: "bg-blue-100 text-blue-700",
  TRANSCRIBING: "bg-blue-100 text-blue-700",
  ANALYZING: "bg-purple-100 text-purple-700",
  EDITING: "bg-amber-100 text-amber-700",
  EXPORTING: "bg-amber-100 text-amber-700",
  READY: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
