const STORAGE_KEY = "spoticristo-owned-recordings";

type OwnedRecordings = Record<string, string>;

function ownedRecordings(): OwnedRecordings {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as OwnedRecordings;
  } catch {
    return {};
  }
}

export function getRecordingProof(id: string) {
  return ownedRecordings()[id];
}

export function rememberRecording(id: string, proof: string) {
  const records = ownedRecordings();
  records[id] = proof;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function forgetRecording(id: string) {
  const records = ownedRecordings();
  delete records[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getOwnedRecordingIds() {
  return Object.keys(ownedRecordings());
}
