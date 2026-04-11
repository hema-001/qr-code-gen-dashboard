import { NextRequest } from "next/server";
import { proxyRequest, proxyFormData } from "@/app/api/_lib/proxy";

// PUT /api/products/[id] — update a product (FormData with optional image)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyFormData(request, `/api/v1/admin/products/${id}`, { method: "PUT" });
}

// DELETE /api/products/[id] — delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(request, `/api/v1/admin/products/${id}`, {
    method: "DELETE",
  });
}
