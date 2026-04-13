import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// PUT /api/brands/[id] — update a brand
// DELETE /api/brands/[id] — delete a brand
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.text();
  return proxyRequest(request, `/api/v1/admin/brands/${id}`, {
    method: "PUT",
    body,
    extraHeaders: { "Content-Type": "application/json" },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(request, `/api/v1/admin/brands/${id}`, {
    method: "DELETE",
  });
}
