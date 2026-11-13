import Link from "next/link";
import type { Metadata } from "next";
import { NOINDEX } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: "Page not found | Recent Codes" },
  description: "This page doesn't exist. Go back to Recent Codes.",
  robots: NOINDEX ? { index: false, follow: false } : { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>
        <Link href="/">Home</Link> · <Link href="/about">About</Link> · <Link href="/contact">Contact</Link>
      </p>
    </>
  );
}
