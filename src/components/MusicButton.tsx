"use client";

import { Pause, Play } from "./icons";

interface Props {
  name: string;
  onClick: () => void;
  playing: boolean;
  tone: string;
}

export default function MusicButton(props: Props) {
  const Icon = props.playing ? Pause : Play;

  return (
    <button
      onClick={props.onClick}
      className={`relative z-[1] h-24 border-[3px] overflow-hidden bg-white border-black rounded-lg w-full p-5 pt-8 gap-5 flex items-center cursor-pointer transition-all duration-300 disabled:opacity-30 ${
        props.playing ? "border-l-[15px]" : ""
      }`}
    >
      <div className="absolute top-0 left-0 flex">
        <span className="bg-black text-white px-2 rounded-br-lg font-bold z-[2]">
          {props.tone}
        </span>
      </div>
      <Icon className="h-6 shrink-0" />
      <h3 className="text-lg font-semibold truncate">{props.name}</h3>
    </button>
  );
}
