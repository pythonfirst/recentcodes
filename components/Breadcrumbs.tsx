import Link from "next/link";
import { breadcrumbLd, type Crumb } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

/** Visible breadcrumb trail + BreadcrumbList JSON-LD. */
export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <nav aria-label="Breadcrumb" className="crumbs">
        {crumbs.map((c, i) => (
          <span key={c.path}>
            {i > 0 && <span aria-hidden="true"> › </span>}
            {i < crumbs.length - 1 ? <Link href={c.path}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
          </span>
        ))}
      </nav>
    </>
  );
}
