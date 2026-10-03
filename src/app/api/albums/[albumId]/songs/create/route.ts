import { airtableWriteErrorMessage, assertAlbumTable, createRecord, deleteRecord, getTable, replaceAttachment } from "@/lib/airtable";
import { COOKIE_NAME, createOwnershipProof, hasValidSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const MAX_AUDIO_BYTES = 4_000_000;

function parseList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  try {
    const result: unknown = JSON.parse(value);
    return Array.isArray(result) ? result.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [];
  } catch { return []; }
}

export async function POST(request: Request, { params }: { params: { albumId: string } }) {
  try {
    if (!hasValidSession(cookies().get(COOKIE_NAME)?.value)) return NextResponse.json({ message: "Informe a senha para salvar." }, { status: 401 });
    await assertAlbumTable(params.albumId);
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const tone = String(form.get("tone") || "").trim();
    const file = form.get("file");
    if (!name || !tone || !(file instanceof File) || !file.size) return NextResponse.json({ message: "Informe nome, tom e áudio." }, { status: 400 });
    if (file.size > MAX_AUDIO_BYTES) return NextResponse.json({ message: "O áudio deve ter até 4 MB." }, { status: 413 });
    const record = await createRecord(params.albumId, {
      name,
      tone,
      tags: parseList(form.get("tags")),
      playlist: parseList(form.get("playlists")),
    });
    try {
      const table = await getTable(params.albumId);
      const source = table.fields.find((field) => field.name === "src" && field.type === "multipleAttachments");
      if (!source) throw new Error("O campo src não é um anexo.");
      await replaceAttachment(params.albumId, record.id, source.id, source.name, file);
    } catch (uploadError) {
      await deleteRecord(params.albumId, record.id).catch(() => undefined);
      throw uploadError;
    }
    return NextResponse.json({ id: record.id, proof: createOwnershipProof(params.albumId, record.id) });
  } catch (error) {
    console.error("Unable to create song", error);
    return NextResponse.json({ message: airtableWriteErrorMessage(error, "Não foi possível salvar a música.") }, { status: 500 });
  }
}
