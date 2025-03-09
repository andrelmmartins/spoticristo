"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import MusicButton from "@/components/MusicButton";
import { Music } from "@/utils/musics";
import { getMusics } from "@/service/api";

export default function Service() {
  const params = useParams();
  const service = typeof params.service === "string" ? params.service : "";

  const [musics, setMusics] = useState<Music[]>([]);
  const [musicName, setMusicName] = useState<string>();
  const [music, setMusic] = useState<HTMLAudioElement>();

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

  return (
    <>
      <main className="min-h-screen flex  flex-col items-center gap-6 pt-12 p-6">
        <h1 className="font-bold text-3xl pb-6">
          <span className="text-blue-dark">#</span>
          {decodeURIComponent(service)}
        </h1>

        {musics.map((m, i) => {
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
