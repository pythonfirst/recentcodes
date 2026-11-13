/** Server-rendered direct answer to the page's main question (shown right under the H1). */
export default function QuickAnswer({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="answer">
      <strong>Quick answer:</strong> {text}
    </p>
  );
}
