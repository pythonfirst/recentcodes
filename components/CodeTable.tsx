import type { RedeemCode } from "@/lib/games";
import { formatDate } from "@/lib/games";

export const PENDING_LABEL = "Pending official verification";

export default function CodeTable({
  codes,
  empty,
  pending = false,
}: {
  codes: RedeemCode[];
  empty: string;
  pending?: boolean;
}) {
  if (!codes.length) {
    return (
      <p className="empty-codes">
        {pending && (
          <>
            <span className="status-pill">{PENDING_LABEL}</span>{" "}
          </>
        )}
        {empty}
      </p>
    );
  }
  const anySource = codes.some((c) => c.source);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Reward</th>
            <th>Added</th>
            <th>Expires</th>
            {anySource && <th>Official source</th>}
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.code}>
              <td>
                <code>{c.code}</code>
              </td>
              <td>{c.reward || (c.source ? "See official post" : "—")}</td>
              <td>{c.added ? <time dateTime={c.added}>{formatDate(c.added, true)}</time> : "—"}</td>
              <td>{c.expires ? formatDate(c.expires) : "—"}</td>
              {anySource && (
                <td>
                  {c.source ? (
                    <a href={c.source} rel="noopener noreferrer">
                      {c.sourceName || "Official post"}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
