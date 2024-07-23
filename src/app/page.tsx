"use client";

import { useEffect, useState } from "react";

import MusicButton from "@/components/MusicButton";

const musics = [
  "A alegria do senhor é nossa força (E).mp3",
  "A escolhida (E).mp3",
  "A pé seco (G).mp3",
  "Abraço bom (G).mp3",
  "chuva de grava (studio) - C.mp3",
  "Dança da amizade (G).mp3",
  "derrama o ter amor (studio) - F.mp3",
  "Derrama o teu amor aqui (F).mp3",
  "Deus quero louvar-te (E).mp3",
  "Estatua de sal (D).mp3",
  "Estrangeiro aqui (C) .mp3",
  "Eu quero ser de Deus (D) .mp3",
  "Exército de Deus (G).mp3",
  "Marca da Vitória (Am) .mp3",
  "Melo dos Animais - E.mp3",
  "Melo dos animais (E) .mp3",
  "Minha essência (A).mp3",
  "Molinho para Jesus (D).mp3",
  "Nosso general (Am).mp3",
  "o amor (Studio) - C.mp3",
  "O senhor é rei (Bm).mp3",
  "passa fogo (C).mp3",
  "passeio e caranguejo - Am.mp3",
  "Pescador de Cristo (E).mp3",
  "Pipoca (G).mp3",
  "Pirado por Jesus (E).mp3",
  "quero louvar- te (E).mp3",
  "Reggae do missionário (C).mp3",
  "Templo Vivo (C).mp3",
  "Templo Vivo (studio) - C.mp3",
  "tum-tum-tum de Deus (E).mp3",
  "txuco - D.mp3",
  "txuco (D).mp3",
  "vamos cantar (D).mp3",
];

export default function Home() {
  const [musicName, setMusicName] = useState<string>();
  const [music, setMusic] = useState<HTMLAudioElement>();

  useEffect(() => {
    music?.pause();

    if (musicName) {
      const audio = new Audio(`/musics/${encodeURIComponent(musicName)}`);
      audio.play();
      setMusic(audio)
    }
  }, [musicName]);

  useEffect(() => {
    if(music) {
      music.addEventListener("ended", () => {
        setMusicName(undefined);
      });
  
      return () => {
        music.removeEventListener("ended", () => {
          setMusicName(undefined);
        });
      };
    }
  }, [music])

  return (
    <main className="min-h-screen flex  flex-col items-center gap-6 p-24">
      <h1 className="font-bold text-3xl">EAC music</h1>
      {musics.map((m, i) => {
        const iMPlaying = m === musicName;
        return (
          <MusicButton
            key={`music-${i}`}
            name={m.replace(".mp3", "")}
            playing={iMPlaying}
            onClick={() => {
              if (iMPlaying) setMusicName(undefined);
              else setMusicName(m);
            }}
          />
        );
      })}
    </main>
  );
}
