'use client'

import { Pause, Play } from "./icons";

interface Props {
    name: string
    onClick: () => void
    playing: boolean
}

export default function MusicButton(props: Props) {
    const Icon = props.playing ? Pause : Play

    return (
        <div onClick={props.onClick} className={`h-24 border-[3px] border-black rounded-lg w-full max-w-[500px] p-5 gap-5 flex items-center cursor-pointer transition-all duration-300 hover:bg-black/5 hover:ml-10`}>
            <Icon className="h-6"/>
            <h3 className="text-xl font-semibold truncate">{props.name}</h3>
        </div>
    )
}