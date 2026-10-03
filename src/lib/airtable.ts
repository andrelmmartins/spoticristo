import "server-only";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_CONTENT_URL = "https://content.airtable.com/v0";

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

interface AirtableTable {
  id: string;
  name: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    options?: { choices?: Array<{ id: string; name: string }> };
  }>;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

function config() {
  const token = process.env.AIRTABLE_TOKEN || process.env.NEXT_PUBLIC_AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE || process.env.NEXT_PUBLIC_AIRTABLE_BASE;
  const albumsTable = process.env.AIRTABLE_ALBUMS_TABLE_ID || process.env.NEXT_PUBLIC_AIRTABLE_ALBUMS_TABLE_ID;

  if (!token || !base || !albumsTable) {
    throw new Error("A configuração do Airtable não está completa no servidor.");
  }

  return { token, base, albumsTable };
}

async function airtableFetch(url: string, init: RequestInit = {}) {
  const { token } = config();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable respondeu ${response.status}: ${body}`);
  }

  return response;
}

export async function listRecords(tableId: string) {
  const { base } = config();
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const search = new URLSearchParams({ "sort[0][field]": "name", "sort[0][direction]": "asc" });
    if (offset) search.set("offset", offset);
    const response = await airtableFetch(`${AIRTABLE_API_URL}/${base}/${tableId}?${search}`);
    const page = (await response.json()) as AirtableListResponse;
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}

export async function listTables() {
  const { base } = config();
  const response = await airtableFetch(`${AIRTABLE_API_URL}/meta/bases/${base}/tables`);
  const result = (await response.json()) as { tables: AirtableTable[] };
  return result.tables;
}

export async function getAlbumTableIds() {
  const { albumsTable } = config();
  const albums = await listRecords(albumsTable);
  return new Set(albums.map((record) => record.fields.id).filter((id): id is string => typeof id === "string"));
}

export async function assertAlbumTable(tableId: string) {
  if (!(await getAlbumTableIds()).has(tableId)) {
    throw new Error("Álbum não encontrado.");
  }
}

export async function getTable(tableId: string) {
  const tables = await listTables();
  const table = tables.find((candidate) => candidate.id === tableId);
  if (!table) throw new Error("Tabela não encontrada.");
  return table;
}

export async function createRecord(tableId: string, fields: Record<string, unknown>) {
  const { base } = config();
  const response = await airtableFetch(`${AIRTABLE_API_URL}/${base}/${tableId}`, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  const data = (await response.json()) as { records: AirtableRecord[] };
  return data.records[0];
}

export async function updateRecord(tableId: string, recordId: string, fields: Record<string, unknown>) {
  const { base } = config();
  const response = await airtableFetch(`${AIRTABLE_API_URL}/${base}/${tableId}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields, typecast: true }),
  });
  return (await response.json()) as AirtableRecord;
}

export async function deleteRecord(tableId: string, recordId: string) {
  const { base } = config();
  await airtableFetch(`${AIRTABLE_API_URL}/${base}/${tableId}/${recordId}`, { method: "DELETE" });
}

export async function uploadAttachment({ recordId, fieldId, file }: {
  recordId: string;
  fieldId: string;
  file: File;
}) {
  const { base } = config();
  const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
  const response = await airtableFetch(
    `${AIRTABLE_CONTENT_URL}/${base}/${recordId}/${fieldId}/uploadAttachment`,
    {
      method: "POST",
      body: JSON.stringify({
        contentType: file.type || "audio/webm",
        file: bytes,
        filename: file.name,
      }),
    },
  );
  return (await response.json()) as AirtableRecord;
}

export async function replaceAttachment(tableId: string, recordId: string, fieldId: string, fieldName: string, file: File) {
  const uploaded = await uploadAttachment({ recordId, fieldId, file });
  const attachments = uploaded.fields[fieldId] ?? uploaded.fields[fieldName];
  const attachment = Array.isArray(attachments) ? attachments.at(-1) : undefined;
  if (!attachment || typeof attachment !== "object" || !("id" in attachment) || typeof attachment.id !== "string") {
    throw new Error("O Airtable não confirmou o novo arquivo.");
  }
  await updateRecord(tableId, recordId, { [fieldName]: [{ id: attachment.id }] });
}

export async function ensureMusicFields() {
  const { base, albumsTable } = config();
  const tables = await listTables();
  const musicTables = tables.filter((table) => table.id !== albumsTable && table.name !== "default");
  const defaultsByField = {
    tags: ["Studio", "Tema", "Guitarra", "Normal", "Axé", "Dinâmica do Caminho"],
    playlist: ["Sexta", "Sábado", "Domingo", "Louvor", "Bloco 1", "Bloco 2", "Bloco 3", "Bloco 4", "Bloco 5"],
  } as const;

  for (const table of musicTables) {
    for (const name of ["tags", "playlist"] as const) {
      const defaults = defaultsByField[name];
      const field = table.fields.find((candidate) => candidate.name === name);
      if (!field) {
        await airtableFetch(`${AIRTABLE_API_URL}/meta/bases/${base}/tables/${table.id}/fields`, {
          method: "POST",
          body: JSON.stringify({
            name,
            type: "multipleSelects",
            options: { choices: defaults.map((choice) => ({ name: choice })) },
          }),
        });
      } else if (field.type !== "multipleSelects") {
        throw new Error(`O campo ${name} da tabela ${table.name} precisa ser seleção múltipla.`);
      }
    }
  }
}
