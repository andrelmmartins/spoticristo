"use client";

import { Song } from "@/@types/interfaces";
import { AlertCircle, Loader2, Mic, Pause, Play, Save, Square, Trash2, Upload, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

const MAX_AUDIO_BYTES = 4_000_000;
const STORAGE_KEY = "spoticristo-owned-recordings";
const DEFAULT_PLAYLISTS = ["Sexta", "Sábado", "Domingo", "Louvor", "Bloco 1", "Bloco 2", "Bloco 3", "Bloco 4", "Bloco 5"];
const DEFAULT_TAGS = ["Studio", "Tema", "Guitarra", "Normal", "Axé", "Dinâmica do Caminho"];
const TONES = [
  ["A", "Lá maior"], ["Am", "Lá menor"], ["A#", "Lá sustenido maior"], ["A#m", "Lá sustenido menor"], ["Bb", "Si bemol maior"], ["Bbm", "Si bemol menor"],
  ["B", "Si maior"], ["Bm", "Si menor"], ["C", "Dó maior"], ["Cm", "Dó menor"], ["C#", "Dó sustenido maior"], ["C#m", "Dó sustenido menor"],
  ["Db", "Ré bemol maior"], ["Dbm", "Ré bemol menor"], ["D", "Ré maior"], ["Dm", "Ré menor"], ["D#", "Ré sustenido maior"], ["D#m", "Ré sustenido menor"],
  ["Eb", "Mi bemol maior"], ["Ebm", "Mi bemol menor"], ["E", "Mi maior"], ["Em", "Mi menor"], ["F", "Fá maior"], ["Fm", "Fá menor"],
  ["F#", "Fá sustenido maior"], ["F#m", "Fá sustenido menor"], ["Gb", "Sol bemol maior"], ["Gbm", "Sol bemol menor"], ["G", "Sol maior"], ["Gm", "Sol menor"],
  ["G#", "Sol sustenido maior"], ["G#m", "Sol sustenido menor"], ["Ab", "Lá bemol maior"], ["Abm", "Lá bemol menor"],
] as const;

type OwnedRecordings = Record<string, string>;

function ownedRecordings(): OwnedRecordings {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as OwnedRecordings; } catch { return {}; }
}

function rememberRecording(id: string, proof: string) {
  const records = ownedRecordings();
  records[id] = proof;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function forgetRecording(id: string) {
  const records = ownedRecordings();
  delete records[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function extensionFor(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

interface RecordingModalProps {
  albumId: string;
  song?: Song;
  availableTags: string[];
  availablePlaylists: string[];
  onClose: () => void;
  onSaved: (id?: string, proof?: string) => Promise<void> | void;
}

export default function RecordingModal({ albumId, song, availableTags, availablePlaylists, onClose, onSaved }: RecordingModalProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState(song?.name || "");
  const [tone, setTone] = useState(song?.tone || "");
  const [tags, setTags] = useState<string[]>(song?.tags || []);
  const [playlists, setPlaylists] = useState<string[]>(song?.playlists || []);
  const [customTags, setCustomTags] = useState("");
  const [customPlaylists, setCustomPlaylists] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const tagChoices = useMemo(() => Array.from(new Set([...DEFAULT_TAGS, ...availableTags, ...tags])).sort(), [availableTags, tags]);
  const playlistChoices = useMemo(() => Array.from(new Set([...DEFAULT_PLAYLISTS, ...availablePlaylists, ...playlists])).sort(), [availablePlaylists, playlists]);

  useEffect(() => {
    const timer = isRecording ? window.setInterval(() => setSeconds((value) => value + 1), 1000) : undefined;
    return () => { if (timer) window.clearInterval(timer); };
  }, [isRecording]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function setAudio(nextFile: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
  }

  function addCustom(value: string, setter: (values: string[]) => void, current: string[]) {
    const extra = value.split(",").map((item) => item.trim()).filter(Boolean);
    setter(Array.from(new Set([...current, ...extra])));
  }

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { setError("Senha incorreta."); return; }
    setAuthenticated(true);
    setPassword("");
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Este navegador não oferece gravação de áudio.");
      return;
    }
    if (!window.isSecureContext) {
      setError("A gravação exige uma conexão segura (HTTPS).");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      setSeconds(0);
      const candidates = ["audio/webm;codecs=opus", "audio/mp4;codecs=mp4a.40.2", "audio/webm", "audio/mp4"];
      const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 48_000 }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (!event.data.size) return;
        chunksRef.current.push(event.data);
        const total = chunksRef.current.reduce((size, chunk) => size + chunk.size, 0);
        if (total > MAX_AUDIO_BYTES) {
          setError("A gravação atingiu o limite de 4 MB e foi interrompida. Grave uma versão menor.");
          recorder.stop();
        }
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop());
        if (blob.size && blob.size <= MAX_AUDIO_BYTES) setAudio(new File([blob], `gravacao.${extensionFor(type)}`, { type }));
        setIsRecording(false);
      };
      recorder.start(1000);
      setIsRecording(true);
    } catch (cause) {
      setError(cause instanceof DOMException && cause.name === "NotAllowedError" ? "Permissão de microfone negada. Libere o microfone nas configurações do navegador." : "Não foi possível iniciar o microfone.");
    }
  }

  function stopRecording() { recorderRef.current?.state === "recording" && recorderRef.current.stop(); }

  function pickUpload(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] || null;
    if (next && next.size > MAX_AUDIO_BYTES) { setError("O áudio deve ter até 4 MB."); event.target.value = ""; return; }
    setError("");
    setAudio(next);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!name.trim() || !tone) { setError("Informe nome e tom."); return; }
    if (!song && !file) { setError("Grave ou envie um arquivo de áudio."); return; }
    const proof = song ? ownedRecordings()[song.id] : undefined;
    if (song && !proof) { setError("Este navegador não pode editar esta música."); return; }
    const body = new FormData();
    body.set("name", name.trim()); body.set("tone", tone);
    body.set("tags", JSON.stringify(Array.from(new Set([...tags, ...customTags.split(",").map((item) => item.trim()).filter(Boolean)]))));
    body.set("playlists", JSON.stringify(Array.from(new Set([...playlists, ...customPlaylists.split(",").map((item) => item.trim()).filter(Boolean)]))));
    if (file) body.set("file", file);
    if (proof) body.set("proof", proof);
    setIsSubmitting(true);
    try {
      const url = song ? `/api/albums/${albumId}/songs/${song.id}` : `/api/albums/${albumId}/songs/create`;
      const response = await fetch(url, { method: song ? "PATCH" : "POST", body });
      const result = await response.json() as { id?: string; proof?: string; message?: string };
      if (!response.ok) throw new Error(result.message || "Não foi possível salvar.");
      if (result.id && result.proof) rememberRecording(result.id, result.proof);
      await onSaved(result.id, result.proof);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar."); }
    finally { setIsSubmitting(false); }
  }

  async function remove() {
    if (!song || !window.confirm(`Excluir “${song.name}”? Esta ação não pode ser desfeita.`)) return;
    const proof = ownedRecordings()[song.id];
    if (!proof) { setError("Este navegador não pode excluir esta música."); return; }
    setIsSubmitting(true); setError("");
    try {
      const response = await fetch(`/api/albums/${albumId}/songs/${song.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proof }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Não foi possível excluir.");
      forgetRecording(song.id);
      await onSaved();
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível excluir."); }
    finally { setIsSubmitting(false); }
  }

  const formatTime = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const toggle = (value: string, current: string[], setter: (next: string[]) => void) => setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  return <div className="fixed inset-0 z-[70] flex items-end bg-black/70 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="recording-title">
    <div className="max-h-[94dvh] w-full overflow-y-auto rounded-t-2xl border border-dark-600 bg-dark-900 p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><h2 id="recording-title" className="text-xl font-bold text-white">{song ? "Editar música" : "Nova música"}</h2><p className="mt-1 text-sm text-dark-300">{song ? "Altere os dados ou substitua o único áudio." : "Grave ou envie um áudio de até 4 MB."}</p></div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-dark-300 hover:bg-dark-700 hover:text-white" aria-label="Fechar"><X className="h-5 w-5" /></button>
      </div>
      {!authenticated ? <form onSubmit={authenticate} className="space-y-4 rounded-xl border border-dark-700 bg-dark-800/60 p-5">
        <p className="text-sm text-dark-200">Digite a senha para continuar.</p>
        <input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-dark-600 bg-dark-900 px-3 py-3 text-white outline-none focus:border-spotify-green" placeholder="Senha" required />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button className="rounded-full bg-spotify-green px-5 py-2.5 font-semibold text-black hover:bg-spotify-green-light">Continuar</button>
      </form> : <form onSubmit={save} className="space-y-5">
        {error && <p className="flex gap-2 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle className="h-5 w-5 shrink-0" />{error}</p>}
        <div className="grid gap-4 sm:grid-cols-[1fr_13rem]"><label className="grid gap-2 text-sm text-dark-200">Nome<input value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-dark-600 bg-dark-800 px-3 py-3 text-white outline-none focus:border-spotify-green" required /></label><label className="grid gap-2 text-sm text-dark-200">Tom<select value={tone} onChange={(event) => setTone(event.target.value)} className="rounded-lg border border-dark-600 bg-dark-800 px-3 py-3 text-white outline-none focus:border-spotify-green" required><option value="">Selecione</option>{TONES.map(([value, label]) => <option key={value} value={value}>{value} — {label}</option>)}</select></label></div>
        <section className="rounded-xl border border-dark-700 bg-dark-800/40 p-4"><div className="mb-3 flex flex-wrap gap-3"><button type="button" onClick={isRecording ? stopRecording : startRecording} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-semibold ${isRecording ? "bg-red-500 text-white" : "bg-white text-black"}`}>{isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}{isRecording ? `Parar ${formatTime}` : "Gravar"}</button><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dark-600 px-4 py-2.5 text-sm font-semibold text-white hover:border-dark-400"><Upload className="h-4 w-4" />Enviar áudio<input className="sr-only" type="file" accept="audio/*" onChange={pickUpload} /></label>{file && <button type="button" onClick={() => setAudio(null)} className="rounded-full px-3 py-2 text-sm text-dark-300 hover:text-white">Descartar</button>}</div>{file && <div className="rounded-lg bg-dark-900 p-3"><p className="mb-2 truncate text-xs text-dark-300">{file.name} · {(file.size / 1_000_000).toFixed(2)} MB</p><audio controls src={previewUrl} className="h-10 w-full" /></div>}<p className="mt-3 text-xs text-dark-400">A gravação pede permissão do microfone e funciona somente em HTTPS.</p></section>
        <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">Classificação</legend><div><p className="mb-2 text-sm text-dark-200">Tags</p><div className="max-h-32 space-y-2 overflow-y-auto rounded-lg border border-dark-700 p-3">{tagChoices.map((value) => <label key={value} className="flex items-center gap-2 text-sm text-dark-200"><input type="checkbox" checked={tags.includes(value)} onChange={() => toggle(value, tags, setTags)} />{value}</label>)}</div><input value={customTags} onChange={(event) => setCustomTags(event.target.value)} placeholder="Outras, separadas por vírgula" className="mt-2 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-white outline-none focus:border-spotify-green" /></div><div><p className="mb-2 text-sm text-dark-200">Playlists</p><div className="max-h-32 space-y-2 overflow-y-auto rounded-lg border border-dark-700 p-3">{playlistChoices.map((value) => <label key={value} className="flex items-center gap-2 text-sm text-dark-200"><input type="checkbox" checked={playlists.includes(value)} onChange={() => toggle(value, playlists, setPlaylists)} />{value}</label>)}</div><input value={customPlaylists} onChange={(event) => setCustomPlaylists(event.target.value)} placeholder="Nova playlist, separada por vírgula" className="mt-2 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-white outline-none focus:border-spotify-green" /></div></fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-700 pt-5">{song ? <button type="button" disabled={isSubmitting} onClick={remove} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" />Excluir</button> : <span />}{file && song && <span className="text-xs text-dark-400">O novo arquivo substitui o atual.</span>}<button disabled={isSubmitting} className="ml-auto inline-flex items-center gap-2 rounded-full bg-spotify-green px-5 py-2.5 font-semibold text-black disabled:opacity-60">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isSubmitting ? "Salvando" : "Salvar"}</button></div>
      </form>}
    </div>
  </div>;
}

export function getOwnedRecordingIds() { return Object.keys(ownedRecordings()); }
