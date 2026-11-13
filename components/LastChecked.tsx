import { formatDate } from "@/lib/games";

/** Visible "Last checked" timestamp for a codes page. */
export default function LastChecked({ iso }: { iso: string }) {
  return (
    <p className="last-checked">
      Last checked: <time dateTime={iso}>{formatDate(iso, true)}</time>
    </p>
  );
}
