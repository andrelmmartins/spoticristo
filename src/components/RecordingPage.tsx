"use client";

import AlbumPageSkeleton from "@/components/AlbumPageSkeleton";
import RecordingForm from "@/components/RecordingForm";
import { useAlbum } from "@/contexts/AlbumContext";
import { useSong } from "@/contexts/SongContext";
import { ArrowLeft, Music } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

interface RecordingPageProps {
  songId?: string;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    .sort((first, second) => first.localeCompare(second, "pt-BR"));
}

export default function RecordingPage({ songId }: RecordingPageProps) {
  const { albumId } = useParams<{ albumId: string }>();
  const router = useRouter();
  const { albums, isLoadingAlbums } = useAlbum();
  const { songs, isLoadingSongs, currentAlbumId, getSongs, refreshSongs } = useSong();
  const album = albums.find((candidate) => candidate.id === albumId);
  const song = songId ? songs.find((candidate) => candidate.id === songId) : undefined;
  const availableTags = useMemo(() => uniqueSorted(songs.flatMap((item) => item.tags)), [songs]);
  const availablePlaylists = useMemo(() => uniqueSorted(songs.flatMap((item) => item.playlists)), [songs]);

  useEffect(() => {
    if (albumId) getSongs(albumId);
  }, [albumId, getSongs]);

  if (isLoadingAlbums || currentAlbumId !== albumId || isLoadingSongs) return <AlbumPageSkeleton />;

  if (!album || (songId && !song)) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-dark-700">
            <Music className="h-7 w-7 text-dark-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">{album ? "Música não encontrada" : "Álbum não encontrado"}</h1>
          <p className="mt-2 text-dark-300">Volte ao álbum e tente novamente.</p>
          <Link href={album ? `/${album.id}` : "/"} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-spotify-green px-5 font-semibold text-black">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  const albumUrl = `/${album.id}`;

  return (
    <main className="min-h-dvh bg-dark-900">
      <header className="sticky top-0 z-40 border-b border-dark-700 bg-dark-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push(albumUrl)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-dark-200 hover:bg-dark-700 hover:text-white"
            aria-label="Voltar para o álbum"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-spotify-green">{album.name}</p>
            <h1 className="truncate text-xl font-bold text-white">{song ? "Editar música" : "Nova gravação"}</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <RecordingForm
          key={song?.id || "new"}
          albumId={album.id}
          song={song}
          availableTags={availableTags}
          availablePlaylists={availablePlaylists}
          onCancel={() => router.push(albumUrl)}
          onSaved={async () => {
            await refreshSongs(album.id).catch(() => undefined);
            router.push(albumUrl);
          }}
        />
      </div>
    </main>
  );
}
