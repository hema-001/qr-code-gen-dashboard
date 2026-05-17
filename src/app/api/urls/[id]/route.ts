import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/urls/[id] — get a URL by ID (super_admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(request, `/api/v1/admin/urls/${id}`, {
    requiredRole: "super_admin",
  });
}

// PUT /api/urls/[id] — update a URL (super_admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.text();
  return proxyRequest(request, `/api/v1/admin/urls/${id}`, {
    method: "PUT",
    body,
    extraHeaders: { "Content-Type": "application/json" },
    requiredRole: "super_admin",
  });
}

// DELETE /api/urls/[id] — delete a URL (super_admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(request, `/api/v1/admin/urls/${id}`, {
    method: "DELETE",
    requiredRole: "super_admin",
  });
}
