import { airtableWriteErrorMessage, assertAlbumTable, deleteRecord, getTable, replaceAttachment, updateRecord } from "@/lib/airtable";
import { hasValidOwnershipProof } from "@/lib/auth";
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

async function authorize(request: Request, albumId: string, songId: string) {
  const form = await request.formData();
  if (!hasValidOwnershipProof(form.get("proof"), albumId, songId)) return "Este navegador não tem permissão para editar esta música.";
  return form;
}

export async function PATCH(request: Request, { params }: { params: { albumId: string; songId: string } }) {
  try {
    const form = await authorize(request, params.albumId, params.songId);
    if (typeof form === "string") return NextResponse.json({ message: form }, { status: 403 });
    await assertAlbumTable(params.albumId);
    const name = String(form.get("name") || "").trim();
    const tone = String(form.get("tone") || "").trim();
    if (!name || !tone) return NextResponse.json({ message: "Informe nome e tom." }, { status: 400 });
    const fields: Record<string, unknown> = { name, tone, tags: parseList(form.get("tags")), playlist: parseList(form.get("playlists")) };
    const file = form.get("file");
    if (file instanceof File) {
      if (!file.size || file.size > MAX_AUDIO_BYTES) return NextResponse.json({ message: "O áudio deve ter até 4 MB." }, { status: 413 });
    }
    await updateRecord(params.albumId, params.songId, fields);
    if (file instanceof File) {
      const table = await getTable(params.albumId);
      const source = table.fields.find((field) => field.name === "src" && field.type === "multipleAttachments");
      if (!source) throw new Error("O campo src não é um anexo.");
      await replaceAttachment(params.albumId, params.songId, source.id, source.name, file);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to update song", error);
    return NextResponse.json({ message: airtableWriteErrorMessage(error, "Não foi possível atualizar a música.") }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { albumId: string; songId: string } }) {
  try {
    const { proof } = await request.json();
    if (!hasValidOwnershipProof(proof, params.albumId, params.songId)) return NextResponse.json({ message: "Este navegador não tem permissão para excluir esta música." }, { status: 403 });
    await assertAlbumTable(params.albumId);
    await deleteRecord(params.albumId, params.songId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete song", error);
    return NextResponse.json({ message: airtableWriteErrorMessage(error, "Não foi possível excluir a música.") }, { status: 500 });
  }
}
