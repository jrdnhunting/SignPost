export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs/promises"
import path from "path"
import sharp from "sharp"

const ONE_MB = 1024 * 1024

async function compressToUnderOneMB(buffer: Buffer): Promise<Buffer> {
  if (buffer.length <= ONE_MB) {
    return sharp(buffer).jpeg({ quality: 85 }).toBuffer()
  }
  for (const quality of [80, 60, 40, 20]) {
    const compressed = await sharp(buffer).jpeg({ quality }).toBuffer()
    if (compressed.length <= ONE_MB) return compressed
  }
  return sharp(buffer).resize({ width: 1200 }).jpeg({ quality: 50 }).toBuffer()
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.type !== "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("photo") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }

  const filename = `${crypto.randomUUID()}.jpg`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "tasks")
  await fs.mkdir(uploadDir, { recursive: true })

  const raw = Buffer.from(await file.arrayBuffer())
  const compressed = await compressToUnderOneMB(raw)
  await fs.writeFile(path.join(uploadDir, filename), compressed)

  return NextResponse.json({ url: `/uploads/tasks/${filename}` })
}
