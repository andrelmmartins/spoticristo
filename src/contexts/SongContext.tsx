"use client";

import { Song } from "@/@types/interfaces";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useState } from "react";

interface IContext {
  songs: Song[];
  isLoadingSongs: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  currentAlbumId: string | null;
  getSongs: (albumId: string) => void;
  refreshSongs: (albumId?: string) => Promise<void>;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  playNext: () => void;
  playPrevious: () => void;
}

export const SongContext = createContext({} as IContext);

async function fetchSongs(albumId: string): Promise<Song[]> {
  const response = await fetch(`/api/albums/${encodeURIComponent(albumId)}/songs`);
  if (!response.ok) throw new Error("Não foi possível carregar as músicas.");
  const data = await response.json() as { songs: Song[] };
  return data.songs;
}

const ATTACHMENT_URL_REFRESH_MS = 90 * 60 * 1000;

export const SongProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(null);

  const { data: songs = [], isLoading: isLoadingSongs } = useQuery({
    queryKey: ["songs", currentAlbumId],
    queryFn: () => fetchSongs(currentAlbumId!),
    enabled: !!currentAlbumId,
    staleTime: ATTACHMENT_URL_REFRESH_MS,
    refetchInterval: ATTACHMENT_URL_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const getSongs = useCallback((albumId: string) => {
    setCurrentAlbumId(albumId);
  }, []);

  const refreshSongs = useCallback(async (albumId = currentAlbumId) => {
    if (!albumId) return;
    await queryClient.invalidateQueries({ queryKey: ["songs", albumId] });
    await queryClient.refetchQueries({ queryKey: ["songs", albumId], type: "active" });
  }, [currentAlbumId, queryClient]);

  const playNext = useCallback(() => {
    if (currentSong && songs.length > 0) {
      const currentIndex = songs.findIndex((song) => song.id === currentSong.id);
      const nextIndex = (currentIndex + 1) % songs.length;
      setCurrentSong(songs[nextIndex]);
    }
  }, [currentSong, songs]);

  const playPrevious = useCallback(() => {
    if (currentSong && songs.length > 0) {
      const currentIndex = songs.findIndex((song) => song.id === currentSong.id);
      const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
      setCurrentSong(songs[prevIndex]);
    }
  }, [currentSong, songs]);

  return (
    <SongContext.Provider
      value={{
        songs,
        isLoadingSongs,
        currentSong,
        isPlaying,
        currentAlbumId,
        getSongs,
        refreshSongs,
        setCurrentSong,
        setIsPlaying,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </SongContext.Provider>
  );
};

export const useSong = () => {
  return useContext(SongContext);
};
