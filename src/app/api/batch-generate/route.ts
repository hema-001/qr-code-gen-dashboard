import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// POST /api/batch-generate — submit a batch generation job
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyRequest(request, "/api/batch-generate", {
    method: "POST",
    body,
    extraHeaders: { "Content-Type": "application/json" },
  });
}
