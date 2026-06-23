import { NextResponse } from "next/server"
const B = process.env.BACKEND_URL || "http://localhost:8000"
export async function GET() {
  try {
    const res = await fetch(`${B}/api/history`, { cache: "no-store" })
    return NextResponse.json(await res.json())
  } catch { return NextResponse.json([]) }
}
