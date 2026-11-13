import { renderOg, OG_SIZE } from "@/lib/og";
import { getGame } from "@/lib/games";

export const alt = "Official game redeem codes";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);
  const title = game ? `${game.game} redeem codes` : "Redeem codes";
  const subtitle = "Verifiable official codes only · Unofficial fan resource";
  return renderOg(title, subtitle);
}
