import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Let users freely view the landing page even if logged in
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
