import { NextRequest, NextResponse } from "next/server"

const B = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const res = await fetch(`${B}/api/scan/${id}`, { cache: "no-store" })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ detail: "Backend unavailable" }, { status: 503 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const res = await fetch(`${B}/api/scan/${id}`, { method: "DELETE", cache: "no-store" })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ detail: "Backend unavailable" }, { status: 503 })
  }
}
