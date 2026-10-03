'use client';
import { useState } from 'react';
import { fixWebmDuration } from '@fix-webm-duration/fix';
import { decodeAudioDuration } from '@/lib/audioDuration';
import MusicPlayer from '@/components/MusicPlayer';
import RecordingForm from '@/components/RecordingForm';
export default function AudioCheck() {
  const [rawUrl,setRawUrl]=useState(''); const [wrongUrl,setWrongUrl]=useState('');
  const [playing,setPlaying]=useState(false); const [result,setResult]=useState('');
  async function generate() {
    const context=new AudioContext(); const stream=context.createMediaStreamDestination();
    const osc=context.createOscillator();const gain=context.createGain();gain.gain.value=0.02;osc.connect(gain);gain.connect(stream);osc.start();
    const chunks:Blob[]=[];const recorder=new MediaRecorder(stream.stream,{mimeType:'audio/webm;codecs=opus'});
    recorder.ondataavailable=e=>chunks.push(e.data);
    recorder.onstop=async()=>{osc.stop();stream.stream.getTracks().forEach(t=>t.stop());await context.close();const raw=new Blob(chunks,{type:recorder.mimeType});const wrong=await fixWebmDuration(raw,60_000,{logger:false});const decoded=await decodeAudioDuration(await raw.arrayBuffer());setRawUrl(URL.createObjectURL(raw));setWrongUrl(URL.createObjectURL(wrong));setResult(`Duração real: ${decoded.toFixed(3)} segundos; cabeçalho de teste: 60 segundos`);};
    recorder.start(200);setTimeout(()=>recorder.stop(),2200);
  }
  const song={id:'synthetic',name:'Gravação com duração ausente',tone:'C',src:rawUrl,tags:[],playlists:[]};
  return <div className="p-6"><button onClick={generate}>Gerar áudio com metadados incorretos</button><p>{result}</p>{rawUrl&&<><section aria-label="Teste de edição"><RecordingForm albumId="synthetic" song={song} availableTags={[]} availablePlaylists={[]} onCancel={()=>{}} onSaved={()=>{}}/></section><section aria-label="Teste do player do álbum"><MusicPlayer inline currentSong={{...song,name:'Áudio com cabeçalho errado',src:wrongUrl}} isPlaying={playing} onPlayPause={()=>setPlaying(v=>!v)} onPlaybackChange={setPlaying}/></section></>}</div>;
}
