import "server-only";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(
    {
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
