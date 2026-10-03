"use client";

import { useSong } from "@/contexts/SongContext";
import { useAlbum } from "@/contexts/AlbumContext";
import { useParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import AlbumHeader from "@/components/AlbumHeader";
import SongList from "@/components/SongList";
import SongListSkeleton from "@/components/SongListSkeleton";
import AlbumPageSkeleton from "@/components/AlbumPageSkeleton";
import MusicPlayer from "@/components/MusicPlayer";
import PlaylistSection from "@/components/PlaylistSection";
import { Song } from "@/@types/interfaces";
import RecordingModal, { getOwnedRecordingIds } from "@/components/RecordingModal";
import { ArrowLeft, Music, Search, X } from "lucide-react";
import Link from "next/link";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export default function AlbumPage() {
  const { albumId } = useParams();
  const { albums, isLoadingAlbums } = useAlbum();
  const { 
    songs, 
    isLoadingSongs, 
    currentSong, 
    isPlaying, 
    getSongs, 
    refreshSongs,
    setCurrentSong, 
    setIsPlaying, 
  } = useSong();
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalSong, setModalSong] = useState<Song | null | undefined>(undefined);
  const [ownedSongIds, setOwnedSongIds] = useState<Set<string>>(new Set());
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const currentAlbum = albums.find((album) => album.id === albumId);

  const playlists = useMemo(() => {
    const names = new Map<string, string>();

    songs.forEach((song) => {
      song.playlists.forEach((playlist) => {
        const normalizedName = normalizeSearch(playlist.trim());
        if (normalizedName && !names.has(normalizedName)) {
          names.set(normalizedName, playlist.trim());
        }
      });
    });

    return Array.from(names.values()).sort((first, second) =>
      first.localeCompare(second, "pt-BR"),
    );
  }, [songs]);

  const filteredSongs = useMemo(() => {
    const normalizedQuery = normalizeSearch(deferredSearchQuery.trim());
    const normalizedPlaylist = selectedPlaylist
      ? normalizeSearch(selectedPlaylist)
      : null;

    return songs.filter((song) => {
      const belongsToPlaylist = !normalizedPlaylist || song.playlists.some(
        (playlist) => normalizeSearch(playlist) === normalizedPlaylist,
      );

      if (!belongsToPlaylist) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [song.name, song.tone, ...song.tags, ...song.playlists]
        .some((value) => normalizeSearch(value).includes(normalizedQuery));
    });
  }, [deferredSearchQuery, selectedPlaylist, songs]);

  useEffect(() => {
    if (albumId) {
      getSongs(albumId as string);
    }
  }, [albumId, getSongs]);

  useEffect(() => {
    setSelectedPlaylist(null);
    setSearchQuery("");
  }, [albumId]);

  useEffect(() => {
    setOwnedSongIds(new Set(getOwnedRecordingIds()));
  }, [songs]);

  useEffect(() => {
    if (!currentSong) return;
    const refreshedSong = songs.find((song) => song.id === currentSong.id);
    if (refreshedSong && refreshedSong.src !== currentSong.src) {
      setCurrentSong(refreshedSong);
    }
  }, [currentSong, setCurrentSong, songs]);

  useEffect(() => {
    if (selectedPlaylist && !playlists.includes(selectedPlaylist)) {
      setSelectedPlaylist(null);
    }
  }, [playlists, selectedPlaylist]);

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      setCurrentSong(filteredSongs[0]);
      setIsPlaying(true);
    }
  };

  const handleSongSelect = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handlePlaylistSelect = (playlist: string) => {
    setSelectedPlaylist((current) => current === playlist ? null : playlist);
  };

  const handleNext = () => {
    if (!currentSong || filteredSongs.length === 0) {
      return;
    }

    const currentIndex = filteredSongs.findIndex((song) => song.id === currentSong.id);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % filteredSongs.length;
    setCurrentSong(filteredSongs[nextIndex]);
  };

  const handlePrevious = () => {
    if (!currentSong || filteredSongs.length === 0) {
      return;
    }

    const currentIndex = filteredSongs.findIndex((song) => song.id === currentSong.id);
    const previousIndex = currentIndex <= 0 ? filteredSongs.length - 1 : currentIndex - 1;
    setCurrentSong(filteredSongs[previousIndex]);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClosePlayer = () => {
    setCurrentSong(null);
    setIsPlaying(false);
  };

  if (isLoadingAlbums) {
    return <AlbumPageSkeleton />;
  }

  if (!currentAlbum) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎵</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Álbum não encontrado</h1>
          <p className="text-dark-300 mb-6">O álbum que você está procurando não existe ou foi removido.</p>
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 bg-spotify-green text-black px-6 py-3 rounded-full font-semibold hover:bg-spotify-green-light transition-colors hover:scale-105 transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para início</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentSong ? "pb-36 sm:pb-28" : ""}`}>
      <div className="hidden lg:block sticky top-0 z-40 bg-dark-900/80 backdrop-blur-md border-b border-dark-700">
        <div className="px-8 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-white hover:text-spotify-green transition-colors p-2 -m-2 rounded-lg hover:bg-dark-800/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Link>
        </div>
      </div>

      <AlbumHeader 
        album={currentAlbum} 
        onPlayAll={handlePlayAll}
        onAddSong={() => setModalSong(null)}
      />

      <div className="px-4 lg:px-8 py-8">
        {isLoadingSongs ? (
          <SongListSkeleton />
        ) : songs.length > 0 ? (
          <>
            <PlaylistSection
              playlists={playlists}
              selectedPlaylist={selectedPlaylist}
              onPlaylistSelect={handlePlaylistSelect}
            />

            <section aria-labelledby="songs-title">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 id="songs-title" className="text-2xl font-bold text-white">
                    {selectedPlaylist || "Músicas"}
                  </h2>
                  <p className="mt-1 text-sm text-dark-300">
                    {filteredSongs.length} {filteredSongs.length === 1 ? "música" : "músicas"}
                    {(selectedPlaylist || searchQuery) && ` de ${songs.length}`}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
                  {selectedPlaylist && (
                    <button
                      type="button"
                      onClick={() => setSelectedPlaylist(null)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-dark-600 bg-dark-800/70 px-4 text-sm text-dark-200 transition-colors hover:border-dark-500 hover:text-white"
                    >
                      <span className="max-w-48 truncate">{selectedPlaylist}</span>
                      <X className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Limpar filtro de playlist</span>
                    </button>
                  )}

                  <div className="relative block w-full sm:w-80">
                    <label htmlFor="song-search" className="sr-only">
                      Buscar músicas
                    </label>
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
                    <input
                      id="song-search"
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Buscar música, tom ou tag"
                      className="min-h-11 w-full rounded-full border border-dark-600 bg-dark-800/70 py-2.5 pl-11 pr-10 text-sm text-white outline-none transition-colors placeholder:text-dark-400 focus:border-spotify-green focus:ring-1 focus:ring-spotify-green"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-dark-300 transition-colors hover:bg-dark-600 hover:text-white"
                        aria-label="Limpar busca"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredSongs.length > 0 ? (
                <SongList
                  songs={filteredSongs}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  onSongSelect={handleSongSelect}
                  onPlayPause={handlePlayPause}
                  editableSongIds={ownedSongIds}
                  onEditSong={(song) => setModalSong(song)}
                />
              ) : (
                <div className="rounded-lg border border-dark-700 bg-dark-800/40 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dark-700">
                    <Search className="h-7 w-7 text-dark-400" />
                  </div>
                  <p className="font-medium text-white">Nenhuma música encontrada</p>
                  <p className="mt-1 text-sm text-dark-400">Tente limpar ou alterar os filtros.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlaylist(null);
                      setSearchQuery("");
                    }}
                    className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-dark-400" />
            </div>
            <p className="text-dark-400">Nenhuma música encontrada neste álbum</p>
          </div>
        )}
      </div>

      <MusicPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSongSelect={handleSongSelect}
        onClose={handleClosePlayer}
      />
      {modalSong !== undefined && (
        <RecordingModal
          albumId={currentAlbum.id}
          song={modalSong || undefined}
          availableTags={Array.from(new Set(songs.flatMap((song) => song.tags)))}
          availablePlaylists={Array.from(new Set(songs.flatMap((song) => song.playlists)))}
          onClose={() => setModalSong(undefined)}
          onSaved={async () => {
            await refreshSongs(currentAlbum.id);
            setOwnedSongIds(new Set(getOwnedRecordingIds()));
          }}
        />
      )}
    </div>
  );
}
