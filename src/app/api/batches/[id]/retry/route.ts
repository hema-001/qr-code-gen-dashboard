import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// POST /api/batches/[id]/retry — retry a failed batch
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(request, `/api/v1/admin/batches/${id}/retry`, {
    method: "POST",
    extraHeaders: { "Content-Type": "application/json" },
  });
}
