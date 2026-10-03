import { COOKIE_NAME, createSession, verifyPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!verifyPassword(password)) {
      return NextResponse.json({ message: "Senha incorreta." }, { status: 401 });
    }

    const session = createSession();
    const response = NextResponse.json({ ok: true, expiresAt: session.expiresAt });
    response.cookies.set(COOKIE_NAME, session.value, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Não foi possível validar a senha." }, { status: 400 });
  }
}
