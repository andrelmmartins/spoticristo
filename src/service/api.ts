import axios from "axios";

const base = process.env.NEXT_PUBLIC_AIRTABLE_BASE;
const personalToken = process.env.NEXT_PUBLIC_AIRTABLE_TOKEN;

const api = axios.create({
  headers: {
    Authorization: `Bearer ${personalToken}`,
  },
});

interface Field {
  type: string;
  id: string;
  name: string;
  options?: {
      isReversed: boolean;
  };
}

interface View {
  id: string;
  name: string;
  type: string;
}

interface Table {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: Field[];
  views: View[];
}

interface ServicesResponse {
  tables: Table[];
}

export const getServices = async () => {
  return api.get<ServicesResponse>(`https://api.airtable.com/v0/meta/bases/${base}/tables`);
};

interface RecordFields {
  name: string;
  tone: string;
  src: {
    id: string
    url: string
    filename: string
    size: number,
    type: string
  }[]
}

interface RecordItem {
  id: string;
  createdTime: string;
  fields: RecordFields;
}

interface MusicsResponse {
  records: RecordItem[];
}

export const getMusics = async (tableId: string) => {
    return api.get<MusicsResponse>(`https://api.airtable.com/v0/${base}/${tableId}/`, {
      params: {
        sort: [{ field: "name", direction: "asc" }],
      },
    });
  };

