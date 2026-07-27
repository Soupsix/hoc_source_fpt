import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "admin_session";
const DEFAULT_SECRET = "default_secret_key_change_me_in_production_env_file";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyToken(token) : false;

  // Exact /admin route logic
  if (pathname === "/admin") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/sets", request.url));
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Protected admin sub-pages
  if (pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/admin/sets", request.url));
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected admin API endpoints
  if (pathname.startsWith("/api/admin/")) {
    if (pathname === "/api/admin/login") {
      return NextResponse.next();
    }
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: Bạn chưa đăng nhập." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
