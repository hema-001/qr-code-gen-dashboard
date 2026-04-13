import { NextRequest } from "next/server";
import { proxyRequest, proxyFormData } from "@/app/api/_lib/proxy";

// GET /api/products — list products (with optional page/limit query params)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const path = `/api/v1/admin/products${query ? `?${query}` : ""}`;
  return proxyRequest(request, path);
}

// POST /api/products — create a product (FormData with optional image)
export async function POST(request: NextRequest) {
  return proxyFormData(request, "/api/v1/admin/products", { method: "POST" });
}
