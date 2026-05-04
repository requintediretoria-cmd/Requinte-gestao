import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractNFFromImage } from "@/lib/extract-nf";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não suportado. Use JPG, PNG ou WebP." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");

  const uploadDir = join(process.cwd(), "public", "uploads", "notas");
  await mkdir(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await writeFile(join(uploadDir, filename), buffer);

  const extracted = await extractNFFromImage(
    base64,
    file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
  );

  return NextResponse.json({
    extracted,
    imagemPath: `/uploads/notas/${filename}`,
    imagemNome: file.name,
  });
}
