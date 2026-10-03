"use client";

import { Song } from "@/@types/interfaces";
import {
  forgetRecording,
  getRecordingProof,
  rememberRecording,
} from "@/lib/recordingOwnership";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Mic,
  Plus,
  Save,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const MAX_AUDIO_BYTES = 4_000_000;

export const TONES = [
  ["A", "Lá maior"], ["Am", "Lá menor"], ["A#", "Lá sustenido maior"], ["A#m", "Lá sustenido menor"], ["Bb", "Si bemol maior"], ["Bbm", "Si bemol menor"],
  ["B", "Si maior"], ["Bm", "Si menor"], ["C", "Dó maior"], ["Cm", "Dó menor"], ["C#", "Dó sustenido maior"], ["C#m", "Dó sustenido menor"],
  ["Db", "Ré bemol maior"], ["Dbm", "Ré bemol menor"], ["D", "Ré maior"], ["Dm", "Ré menor"], ["D#", "Ré sustenido maior"], ["D#m", "Ré sustenido menor"],
  ["Eb", "Mi bemol maior"], ["Ebm", "Mi bemol menor"], ["E", "Mi maior"], ["Em", "Mi menor"], ["F", "Fá maior"], ["Fm", "Fá menor"],
  ["F#", "Fá sustenido maior"], ["F#m", "Fá sustenido menor"], ["Gb", "Sol bemol maior"], ["Gbm", "Sol bemol menor"], ["G", "Sol maior"], ["Gm", "Sol menor"],
  ["G#", "Sol sustenido maior"], ["G#m", "Sol sustenido menor"], ["Ab", "Lá bemol maior"], ["Abm", "Lá bemol menor"],
] as const;

function extensionFor(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

function normalize(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function responseMessage(response: Response, fallback: string) {
  if (response.status === 413) {
    return "O arquivo ultrapassou o limite de envio. Grave uma versão menor e tente novamente.";
  }

  try {
    const result = await response.json() as { message?: string };
    return result.message || fallback;
  } catch {
    return fallback;
  }
}

interface ValuePickerProps {
  label: string;
  description: string;
  emptyMessage: string;
  addLabel: string;
  placeholder: string;
  choices: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function ValuePicker({
  label,
  description,
  emptyMessage,
  addLabel,
  placeholder,
  choices,
  selected,
  onChange,
}: ValuePickerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const values = useMemo(
    () => uniqueValues([...choices, ...selected]).sort((first, second) => first.localeCompare(second, "pt-BR")),
    [choices, selected],
  );

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  function isSelected(value: string) {
    const key = normalize(value);
    return selected.some((item) => normalize(item) === key);
  }

  function toggle(value: string) {
    if (isSelected(value)) {
      onChange(selected.filter((item) => normalize(item) !== normalize(value)));
    } else {
      onChange(uniqueValues([...selected, value]));
    }
  }

  function addDraft() {
    const additions = draft.split(",").map((value) => value.trim()).filter(Boolean);
    if (!additions.length) return;
    onChange(uniqueValues([...selected, ...additions]));
    setDraft("");
    setIsAdding(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addDraft();
    }
    if (event.key === "Escape") {
      setDraft("");
      setIsAdding(false);
    }
  }

  return (
    <fieldset>
      <legend className="text-base font-semibold text-white">{label}</legend>
      <p className="mt-1 text-sm text-dark-400">{description}</p>

      {values.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {values.map((value) => {
            const active = isSelected(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(value)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-spotify-green bg-spotify-green/15 text-spotify-green"
                    : "border-dark-600 bg-dark-800 text-dark-200 hover:border-dark-400 hover:text-white"
                }`}
              >
                {active && <Check className="h-4 w-4" aria-hidden="true" />}
                <span>{value}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-dark-600 px-4 py-3 text-sm text-dark-400">
          {emptyMessage}
        </p>
      )}

      {isAdding ? (
        <div className="mt-4 rounded-xl border border-spotify-green/40 bg-dark-900 p-3">
          <label className="text-sm font-medium text-white" htmlFor={`${label}-new-value`}>
            {addLabel}
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              id={`${label}-new-value`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-11 flex-1 rounded-lg border border-dark-600 bg-dark-800 px-3 text-white outline-none placeholder:text-dark-400 focus:border-spotify-green focus:ring-1 focus:ring-spotify-green"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addDraft}
                disabled={!draft.trim()}
                className="min-h-11 flex-1 rounded-lg bg-white px-4 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => { setDraft(""); setIsAdding(false); }}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white"
                aria-label="Cancelar criação"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-dark-400">Você pode adicionar vários valores separados por vírgula.</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-dark-600 px-4 text-sm font-semibold text-white transition-colors hover:border-spotify-green hover:text-spotify-green"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      )}
    </fieldset>
  );
}

interface RecordingFormProps {
  albumId: string;
  song?: Song;
  availableTags: string[];
  availablePlaylists: string[];
  onCancel: () => void;
  onSaved: () => Promise<void> | void;
}

export default function RecordingForm({
  albumId,
  song,
  availableTags,
  availablePlaylists,
  onCancel,
  onSaved,
}: RecordingFormProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(song?.name || "");
  const [tone, setTone] = useState(song?.tone || "");
  const [tags, setTags] = useState<string[]>(song?.tags || []);
  const [playlists, setPlaylists] = useState<string[]>(song?.playlists || []);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const timer = isRecording
      ? window.setInterval(() => setSeconds((value) => value + 1), 1000)
      : undefined;
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

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsAuthenticating(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "Não foi possível validar a senha."));
      setAuthenticated(true);
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível validar a senha.");
    } finally {
      setIsAuthenticating(false);
    }
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
      setAudio(null);

      const candidates = ["audio/webm;codecs=opus", "audio/mp4;codecs=mp4a.40.2", "audio/webm", "audio/mp4"];
      const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 48_000 })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (!event.data.size) return;
        chunksRef.current.push(event.data);
        const total = chunksRef.current.reduce((size, chunk) => size + chunk.size, 0);
        if (total > MAX_AUDIO_BYTES && recorder.state === "recording") {
          setError("A gravação atingiu o limite de 4 MB e foi interrompida. Grave uma versão menor.");
          recorder.stop();
        }
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((track) => track.stop());
        if (blob.size && blob.size <= MAX_AUDIO_BYTES) {
          setAudio(new File([blob], `gravacao.${extensionFor(type)}`, { type }));
        }
        setIsRecording(false);
      };
      recorder.onerror = () => {
        setError("A gravação foi interrompida pelo navegador. Tente novamente.");
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };
      recorder.start(1000);
      setIsRecording(true);
    } catch (cause) {
      setError(
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Permissão de microfone negada. Libere o microfone nas configurações do navegador."
          : "Não foi possível iniciar o microfone.",
      );
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function pickUpload(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] || null;
    if (next && next.size > MAX_AUDIO_BYTES) {
      setError("O áudio deve ter até 4 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setAudio(next);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!name.trim() || !tone) {
      setError("Preencha o nome e escolha o tom da música.");
      return;
    }
    if (!song && !file) {
      setError("Grave ou envie um arquivo de áudio antes de salvar.");
      return;
    }

    const proof = song ? getRecordingProof(song.id) : undefined;
    if (song && !proof) {
      setError("Este navegador não pode editar esta música.");
      return;
    }

    const body = new FormData();
    body.set("name", name.trim());
    body.set("tone", tone);
    body.set("tags", JSON.stringify(tags));
    body.set("playlists", JSON.stringify(playlists));
    if (file) body.set("file", file);
    if (proof) body.set("proof", proof);
    setIsSubmitting(true);

    try {
      const url = song
        ? `/api/albums/${albumId}/songs/${song.id}`
        : `/api/albums/${albumId}/songs/create`;
      const response = await fetch(url, { method: song ? "PATCH" : "POST", body });
      if (response.status === 401) {
        setAuthenticated(false);
        throw new Error("Sua sessão expirou. Digite a senha novamente para preservar e salvar os dados preenchidos.");
      }
      if (!response.ok) throw new Error(await responseMessage(response, "Não foi possível salvar a música."));
      const result = await response.json() as { id?: string; proof?: string };
      if (result.id && result.proof) rememberRecording(result.id, result.proof);
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a música.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function remove() {
    if (!song || !window.confirm(`Excluir “${song.name}”? Esta ação não pode ser desfeita.`)) return;
    const proof = getRecordingProof(song.id);
    if (!proof) {
      setError("Este navegador não pode excluir esta música.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/albums/${albumId}/songs/${song.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, "Não foi possível excluir a música."));
      forgetRecording(song.id);
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir a música.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authenticated) {
    return (
      <form onSubmit={authenticate} className="mx-auto max-w-lg rounded-2xl border border-dark-700 bg-dark-800/60 p-5 shadow-2xl sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spotify-green">Acesso protegido</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Digite a senha para continuar</h1>
          <p className="mt-2 text-sm text-dark-300">A senha protege a criação e edição das gravações.</p>
        </div>

        {error && (
          <p role="alert" className="mb-4 flex gap-2 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </p>
        )}

        <label htmlFor="recording-password" className="text-sm font-medium text-dark-200">Senha</label>
        <div className="relative mt-2">
          <input
            id="recording-password"
            autoFocus
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            className="min-h-12 w-full rounded-lg border border-dark-600 bg-dark-900 px-4 pr-12 text-white outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-full px-5 text-sm font-semibold text-dark-200 hover:bg-dark-700 hover:text-white">
            Cancelar
          </button>
          <button disabled={isAuthenticating} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-spotify-green px-6 font-semibold text-black hover:bg-spotify-green-light disabled:opacity-60">
            {isAuthenticating && <Loader2 className="h-4 w-4 animate-spin" />}
            {isAuthenticating ? "Validando…" : "Continuar"}
          </button>
        </div>
      </form>
    );
  }

  const formatTime = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <form onSubmit={save} className="space-y-6">
      {error && (
        <p role="alert" className="flex gap-2 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </p>
      )}

      <section aria-labelledby="audio-title" className="rounded-2xl border border-dark-700 bg-dark-800/50 p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-spotify-green font-bold text-black">1</span>
          <div>
            <h2 id="audio-title" className="text-lg font-bold text-white">Áudio</h2>
            <p className="mt-1 text-sm text-dark-300">Grave agora ou envie um arquivo de até 4 MB.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-semibold ${isRecording ? "bg-red-500 text-white" : "bg-white text-black hover:bg-dark-100"}`}
          >
            {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
            {isRecording ? `Parar gravação · ${formatTime}` : file ? "Gravar novamente" : "Começar a gravar"}
          </button>
          {!isRecording && (
            <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-dark-600 px-5 text-sm font-semibold text-white hover:border-dark-400">
              <Upload className="h-4 w-4" />
              Enviar arquivo
              <input className="sr-only" type="file" accept="audio/*" onChange={pickUpload} />
            </label>
          )}
        </div>

        {isRecording && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <div>
              <p className="font-semibold">Gravando</p>
              <p className="text-sm text-red-200/80">Toque em “Parar gravação” quando terminar.</p>
            </div>
          </div>
        )}

        {file && !isRecording && (
          <div className="mt-5 rounded-xl border border-spotify-green/25 bg-dark-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-white"><Check className="h-4 w-4 text-spotify-green" />Áudio pronto</p>
                <p className="mt-1 truncate text-xs text-dark-300">{file.name} · {(file.size / 1_000_000).toFixed(2)} MB</p>
              </div>
              <button type="button" onClick={() => setAudio(null)} className="shrink-0 rounded-full px-3 py-2 text-sm text-dark-300 hover:bg-dark-700 hover:text-white">Descartar</button>
            </div>
            <audio controls src={previewUrl} className="h-10 w-full" />
          </div>
        )}

        {!file && !isRecording && song && (
          <p className="mt-4 text-sm text-dark-400">O áudio atual será mantido se você não gravar ou enviar outro.</p>
        )}
      </section>

      <section aria-labelledby="details-title" className="rounded-2xl border border-dark-700 bg-dark-800/50 p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-spotify-green font-bold text-black">2</span>
          <div>
            <h2 id="details-title" className="text-lg font-bold text-white">Identificação</h2>
            <p className="mt-1 text-sm text-dark-300">Informe como a música deve aparecer no álbum.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <label className="grid gap-2 text-sm font-medium text-dark-200">
            Nome da música
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-12 rounded-lg border border-dark-600 bg-dark-900 px-4 text-white outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-dark-200">
            Tom
            <select
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              className="min-h-12 rounded-lg border border-dark-600 bg-dark-900 px-4 text-white outline-none focus:border-spotify-green focus:ring-1 focus:ring-spotify-green"
              required
            >
              <option value="">Selecione</option>
              {TONES.map(([value, label]) => <option key={value} value={value}>{value} — {label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section aria-labelledby="organization-title" className="rounded-2xl border border-dark-700 bg-dark-800/50 p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-spotify-green font-bold text-black">3</span>
          <div>
            <h2 id="organization-title" className="text-lg font-bold text-white">Organização</h2>
            <p className="mt-1 text-sm text-dark-300">Opcional. Selecione o que já existe neste álbum ou crie algo novo.</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <ValuePicker
            label="Tags"
            description="Características da gravação, como tema ou instrumento."
            emptyMessage="Este álbum ainda não possui tags."
            addLabel="Nova tag"
            placeholder="Ex.: Tema, Guitarra"
            choices={availableTags}
            selected={tags}
            onChange={setTags}
          />
          <ValuePicker
            label="Playlists"
            description="Grupos nos quais esta música deve aparecer."
            emptyMessage="Este álbum ainda não possui playlists."
            addLabel="Nova playlist"
            placeholder="Ex.: Domingo, Bloco 1"
            choices={availablePlaylists}
            selected={playlists}
            onChange={setPlaylists}
          />
        </div>
      </section>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-col-reverse gap-3 border-t border-dark-700 bg-dark-900/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:items-center sm:rounded-2xl sm:border sm:px-5">
        {song && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={remove}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Excluir música
          </button>
        )}
        <div className="flex flex-1 gap-3 sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="min-h-11 flex-1 rounded-full px-5 text-sm font-semibold text-dark-200 hover:bg-dark-700 hover:text-white disabled:opacity-50 sm:flex-none">
            Cancelar
          </button>
          <button
            disabled={isRecording || isSubmitting}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-spotify-green px-6 font-semibold text-black hover:bg-spotify-green-light disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSubmitting ? "Enviando áudio…" : song ? "Salvar alterações" : "Salvar música"}
          </button>
        </div>
      </div>
    </form>
  );
}
