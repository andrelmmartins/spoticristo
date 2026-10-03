import { assertAlbumTable, listRecords } from "@/lib/airtable";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { albumId: string } }) {
  try {
    await assertAlbumTable(params.albumId);
    const records = await listRecords(params.albumId);
    const songs = records.map((record) => {
      const fields = record.fields;
      const src = Array.isArray(fields.src) ? fields.src[0] : undefined;
      const arrayField = (name: string) => Array.isArray(fields[name])
        ? fields[name].filter((value): value is string => typeof value === "string")
        : typeof fields[name] === "string" ? [fields[name] as string] : [];
      return {
        id: record.id,
        name: typeof fields.name === "string" ? fields.name : "",
        tone: typeof fields.tone === "string" ? fields.tone : "",
        src: src && typeof src === "object" && "url" in src ? String(src.url) : "",
        tags: arrayField("tags"),
        playlists: arrayField("playlist"),
      };
    }).filter((song) => song.name || song.tone || song.src);
    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Unable to load songs", error);
    return NextResponse.json({ message: "Não foi possível carregar as músicas." }, { status: 404 });
  }
}
