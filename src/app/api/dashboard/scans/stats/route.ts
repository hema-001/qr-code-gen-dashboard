import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

const ALLOWED_PERIODS = new Set(["7d", "30d", "90d", "1y"]);

// GET /api/dashboard/scans/stats?period=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sanitized = new URLSearchParams();
  const period = searchParams.get("period");
  if (period && ALLOWED_PERIODS.has(period)) sanitized.set("period", period);
  const query = sanitized.toString();
  const path = `/api/v1/admin/dashboard/scans/stats${query ? `?${query}` : ""}`;
  return proxyRequest(request, path);
}
