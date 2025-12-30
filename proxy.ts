import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get("host") || ""

  // Get the subdomain from the hostname
  // e.g., "tech.foru.ms" -> "tech"
  const subdomain = hostname.split(".")[0]

  const mainDomains = ["localhost", "127.0.0.1", "foru.ms", "www", "app", "v0"]
  const isMainDomain =
    mainDomains.some((d) => hostname.includes(d)) ||
    hostname.includes("vercel.app") ||
    hostname.includes("v0.dev") ||
    // Exclude v0 preview subdomains (they start with "preview-")
    subdomain.startsWith("preview-") ||
    // Exclude any hostname that looks like a v0 preview URL
    hostname.match(/^[a-z0-9-]+\.v0\.dev$/) !== null ||
    // If subdomain is very long (like v0 preview hashes), skip
    subdomain.length > 20

  // If we're on a subdomain and not the main domain
  if (!isMainDomain && subdomain && subdomain !== "www") {
    // Rewrite to the forum page with subdomain as a parameter
    url.pathname = `/f/${subdomain}${url.pathname === "/" ? "" : url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
