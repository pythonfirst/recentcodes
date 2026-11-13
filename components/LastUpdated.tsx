import { formatDate } from "@/lib/games";

/** Visible "Last updated" date; must match the page's JSON-LD dateModified. */
export default function LastUpdated({ date }: { date?: string }) {
  if (!date) return null;
  return (
    <p className="small">
      Last updated: <time dateTime={date}>{formatDate(date)}</time>
    </p>
  );
}
