import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Fail fast if required env vars are absent
if (!process.env.API_BASE) {
  throw new Error("Missing required environment variable: API_BASE");
}
if (!process.env.JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

export const API_BASE = process.env.API_BASE;
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/** Extract and verify the JWT from the request (cookie-first, then Authorization header). */
async function getVerifiedToken(
  request: NextRequest
): Promise<{ rawToken: string; payload: Record<string, unknown> } | null> {
  const cookieToken = request.cookies.get("token")?.value;
  const authHeader = request.headers.get("authorization");
  const rawToken =
    cookieToken ??
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

  if (!rawToken) return null;
  try {
    const { payload } = await jwtVerify(rawToken, JWT_SECRET);
    return { rawToken, payload: payload as Record<string, unknown> };
  } catch {
    return null;
  }
}

/** Return a 401 response for missing/invalid tokens. */
function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Return a 403 response when the role is insufficient. */
function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

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
    /** Require this role (e.g. "super_admin") before forwarding. */
    requiredRole?: string;
    /** Skip token verification (login endpoint only). */
    skipAuth?: boolean;
  }
) {
  let bearerToken: string | null = null;

  if (!options?.skipAuth) {
    const verified = await getVerifiedToken(request);
    if (!verified) return unauthorized();

    if (
      options?.requiredRole &&
      verified.payload.role !== options.requiredRole
    ) {
      return forbidden();
    }

    bearerToken = `Bearer ${verified.rawToken}`;
  }

  const method = options?.method || request.method;

  const headers: Record<string, string> = {};
  if (bearerToken) headers["Authorization"] = bearerToken;
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
      if (contentDisposition)
        responseHeaders.set("content-disposition", contentDisposition);
      return new NextResponse(blob, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`API proxy error [${method} ${backendPath}]:`, err);
    } else {
      console.error(`API proxy error: ${method} ${backendPath}`);
    }
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
  options?: { method?: string; requiredRole?: string }
) {
  const verified = await getVerifiedToken(request);
  if (!verified) return unauthorized();

  if (options?.requiredRole && verified.payload.role !== options.requiredRole) {
    return forbidden();
  }

  const method = options?.method || "POST";

  try {
    const formData = await request.formData();

    const backendFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      backendFormData.append(key, value);
    }

    const response = await fetch(`${API_BASE}${backendPath}`, {
      method,
      headers: { Authorization: `Bearer ${verified.rawToken}` },
      body: backendFormData,
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`API proxy error [${method} ${backendPath}]:`, err);
    } else {
      console.error(`API proxy error: ${method} ${backendPath}`);
    }
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 502 }
    );
  }
}

/** Expose token verification for auth sub-routes (me, logout). */
export { getVerifiedToken, JWT_SECRET };
