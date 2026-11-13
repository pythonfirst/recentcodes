import type { RedeemCode } from "@/lib/games";
import { formatDate } from "@/lib/games";

export default function CodeTable({
  codes,
  empty,
}: {
  codes: RedeemCode[];
  empty: string;
}) {
  if (!codes.length) {
    return <p className="empty-codes">{empty}</p>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Reward</th>
            <th>Added</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.code}>
              <td>
                <code>{c.code}</code>
              </td>
              <td>{c.reward || "—"}</td>
              <td>{c.added ? formatDate(c.added) : "—"}</td>
              <td>{c.expires ? formatDate(c.expires) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
