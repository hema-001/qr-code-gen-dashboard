import { NextRequest } from "next/server";
import { proxyRequest } from "@/app/api/_lib/proxy";

// GET /api/batch-generate/jobs/[jobId] — poll job status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  return proxyRequest(request, `/api/batch-generate/jobs/${jobId}`);
}
