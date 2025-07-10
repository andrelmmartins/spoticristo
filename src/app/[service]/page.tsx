"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import MusicButton from "@/components/MusicButton";
import { Music } from "@/utils/musics";
import { getMusics } from "@/service/api";
import { Filter } from "@/components/icons";

export default function Service() {
  const params = useParams();
  const service = typeof params.service === "string" ? params.service : "";

  const [musics, setMusics] = useState<Music[]>([]);
  const [musicName, setMusicName] = useState<string>();
  const [music, setMusic] = useState<HTMLAudioElement>();
  const [filter, setFilter] = useState<string | undefined>("studio");

  async function handleGetMusics() {
    try {
      const response = await getMusics(service);
      setMusics(
        response.data.records
          .filter((music) => Boolean(music.fields.name))
          .map((music) => ({
            name: music.fields.name,
            tone: music.fields.tone,
            src: music.fields.src[0].url,
            studio: music.fields.studio,
            caminho: music.fields.caminho,
          }))
      );
    } catch {}
  }

  useEffect(() => {
    handleGetMusics();
  }, []);

  useEffect(() => {
    music?.pause();

    if (musicName && typeof service === "string") {
      const audio = new Audio(musicName);
      audio.play();
      setMusic(audio);
    }
  }, [musicName]);

  useEffect(() => {
    if (music) {
      music.addEventListener("ended", () => {
        setMusicName(undefined);
      });

      return () => {
        music.removeEventListener("ended", () => {
          setMusicName(undefined);
        });
      };
    }
  }, [music]);

  const hasAnyMusicOfCaminho = musics.some((m) => m.caminho);
  const hasAnyMusicOfStudio = musics.some((m) => m.studio);

  return (
    <>
      <main className="min-h-screen flex  flex-col items-center gap-6 pt-12 p-6">
        <h1 className="font-bold text-3xl pb-6">
          <span className="text-blue-dark">#</span>
          {decodeURIComponent(service)}
        </h1>

        {(hasAnyMusicOfCaminho || hasAnyMusicOfStudio) && (
          <div className="mb-4 flex flex-wrap max-w-[500px] gap-4">
            {hasAnyMusicOfStudio && (
              <button
                onClick={() => {
                  if (filter === "studio") setFilter(undefined);
                  else setFilter("studio");
                }}
                className={`flex gap-2 cursor-pointer font-bold ${
                  filter === "studio"
                    ? "bg-blue-dark text-white"
                    : "bg-black/30"
                } px-5 h-10 items-center rounded-full`}
              >
                Studio
                <Filter className="h-5 w-5" />
              </button>
            )}

            {hasAnyMusicOfCaminho && (
              <button
                onClick={() => {
                  if (filter === "caminho") setFilter(undefined);
                  else setFilter("caminho");
                }}
                className={`flex gap-2 cursor-pointer font-bold ${
                  filter === "caminho" ? "bg-red text-white" : "bg-black/30"
                } px-5 h-10 items-center rounded-full`}
              >
                Dinâmica do caminho
                <Filter className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {musics
          .map((m, i) => {
            const iMPlaying = m.src === musicName;
            return (
              <div
                className="bg-white w-full max-w-[500px] flex justify-center z-[1]"
                key={`music-${i}`}
              >
                <MusicButton
                  tone={m.tone}
                  name={m.name}
                  playing={iMPlaying}
                  onClick={() => {
                    if (iMPlaying) setMusicName(undefined);
                    else setMusicName(m.src);
                  }}
                  studio={m.studio}
                  caminho={m.caminho}
                  disabled={
                    (filter === "studio" && !m.studio) ||
                    (filter === "caminho" && !m.caminho)
                  }
                />
              </div>
            );
          })}
      </main>

      <div className="h-[300px] pt-[100px] mt-[-100px] background w-full flex items-center justify-center mix-blend-multiply z-0">
        <a
          href="https://www.instagram.com/andrelmmartins/"
          target="_blank"
          className="flex items-center px-5 h-10 bg-black text-white font-bold rounded-full"
        >
          @andrelmmartins
        </a>
      </div>
    </>
  );
}
