import { renderOg, OG_SIZE } from "@/lib/og";

export const alt = "Recent Codes – verifiable official game redeem codes";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return renderOg("Official game redeem codes", "Newest launches first · Unofficial fan resource");
}
