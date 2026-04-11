import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/dashboard/overview
export async function GET(request: NextRequest) {
  return proxyRequest(request, "/api/v1/admin/dashboard/overview");
}
