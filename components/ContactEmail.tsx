"use client";

import { useEffect, useState, type MouseEvent } from "react";

/** Light anti-scraping: the mailto address is assembled in the browser, not in the server HTML. */
const USER = "foryourtools";
const HOST = "gmail";
const TLD = "com";
const FALLBACK = `${USER} [at] ${HOST} [dot] ${TLD}`;

function address() {
  return `${USER}@${HOST}.${TLD}`;
}

export default function ContactEmail() {
  const [mailto, setMailto] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMailto(`mailto:${address()}`);
  }, []);

  function openMail(e: MouseEvent<HTMLAnchorElement>) {
    if (mailto) return;
    e.preventDefault();
    window.location.href = `mailto:${address()}`;
  }

  return (
    <>
      <a href={mailto} onClick={openMail}>
        {mailto ? address() : FALLBACK}
      </a>
      {!mailto && <noscript>{FALLBACK}</noscript>}
    </>
  );
}
