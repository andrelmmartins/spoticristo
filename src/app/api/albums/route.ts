import { listRecords } from "@/lib/airtable";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tableId = process.env.AIRTABLE_ALBUMS_TABLE_ID || process.env.NEXT_PUBLIC_AIRTABLE_ALBUMS_TABLE_ID;
    if (!tableId) throw new Error("Tabela de álbuns não configurada.");
    const records = await listRecords(tableId);
    const albums = records.map((record) => {
      const fields = record.fields;
      const banner = Array.isArray(fields.banner) ? fields.banner[0] : undefined;
      return {
        id: typeof fields.id === "string" ? fields.id : "",
        name: typeof fields.name === "string" ? fields.name : "",
        banner: banner && typeof banner === "object" && "url" in banner ? String(banner.url) : "",
        color: typeof fields.color === "string" ? fields.color : "",
        tags: Array.isArray(fields.tags) ? fields.tags.filter((tag): tag is string => typeof tag === "string") : [],
      };
    }).filter((album) => album.id);
    return NextResponse.json({ albums });
  } catch (error) {
    console.error("Unable to load albums", error);
    return NextResponse.json({ message: "Não foi possível carregar os álbuns." }, { status: 500 });
  }
}
