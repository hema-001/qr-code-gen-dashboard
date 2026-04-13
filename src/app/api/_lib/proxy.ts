import { NextRequest, NextResponse } from "next/server";

export const API_BASE = process.env.API_BASE || "https://api.mjn-trading.com";

/**
 * Proxy a request to the backend API, fully consuming the response server-side
 * to avoid gzip stream issues with Next.js rewrites.
 */
export async function proxyRequest(
  request: NextRequest,
  backendPath: string,
  options?: {
    method?: string;
    body?: BodyInit | null;
    extraHeaders?: Record<string, string>;
    rawResponse?: boolean;
  }
) {
  const token = request.headers.get("authorization");
  const method = options?.method || request.method;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = token;
  if (options?.extraHeaders) Object.assign(headers, options.extraHeaders);

  try {
    const response = await fetch(`${API_BASE}${backendPath}`, {
      method,
      headers,
      body: options?.body ?? null,
      cache: "no-store",
    });

    // For binary/download responses, stream directly
    if (options?.rawResponse) {
      const blob = await response.blob();
      const responseHeaders = new Headers();
      const contentType = response.headers.get("content-type");
      const contentDisposition = response.headers.get("content-disposition");
      if (contentType) responseHeaders.set("content-type", contentType);
      if (contentDisposition) responseHeaders.set("content-disposition", contentDisposition);
      return new NextResponse(blob, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // For JSON responses
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error(`API proxy error [${method} ${backendPath}]:`, err);
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 502 }
    );
  }
}

/**
 * Proxy a multipart form data request (for file uploads).
 */
export async function proxyFormData(
  request: NextRequest,
  backendPath: string,
  options?: { method?: string }
) {
  const token = request.headers.get("authorization");
  const method = options?.method || "POST";

  try {
    const formData = await request.formData();

    // Convert to a new FormData for the backend fetch
    const backendFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      backendFormData.append(key, value);
    }

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = token;

    const response = await fetch(`${API_BASE}${backendPath}`, {
      method,
      headers,
      body: backendFormData,
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error(`API proxy error [${method} ${backendPath}]:`, err);
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 502 }
    );
  }
}
