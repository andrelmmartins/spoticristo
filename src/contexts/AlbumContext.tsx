"use client";

import { Album } from "@/@types/interfaces";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

interface IContext {
  albums: Album[];
  isLoadingAlbums: boolean;
}

export const AlbumContext = createContext({} as IContext);

async function fetchAlbums(): Promise<Album[]> {
  const response = await fetch("/api/albums");
  if (!response.ok) throw new Error("Não foi possível carregar os álbuns.");
  const data = await response.json() as { albums: Album[] };
  return data.albums;
}

export const AlbumProvider = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: albums = [], isLoading: isLoadingAlbums } = useQuery({
    queryKey: ["albums"],
    queryFn: () => isClient ? fetchAlbums() : Promise.resolve([]),
    enabled: isClient,
  });

  return (
    <AlbumContext.Provider
      value={{
        albums,
        isLoadingAlbums,
      }}
    >
      {children}
    </AlbumContext.Provider>
  );
};

export const useAlbum = () => {
  return useContext(AlbumContext);
};
