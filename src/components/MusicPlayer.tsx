'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, X, Music, Loader2 } from 'lucide-react'
import { Song } from '@/@types/interfaces'
import { getAudioDuration } from '@/lib/audioDuration'

interface MusicPlayerProps {
  currentSong: Song | null
  isPlaying: boolean
  onPlayPause: () => void
  onNext?: () => void
  onPrevious?: () => void
  onClose?: () => void
  inline?: boolean
  onPlaybackChange?: (playing: boolean) => void
}

const MusicPlayer = ({ currentSong, isPlaying, onPlayPause, onNext, onPrevious, onClose, inline = false, onPlaybackChange }: MusicPlayerProps) => {
  const [currentTime, setCurrentTime] = useState(0)
  const [metadataDuration, setMetadataDuration] = useState(0)
  const [decodedDuration, setDecodedDuration] = useState<{ source: string; value: number } | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [playbackError, setPlaybackError] = useState('')
  const source = currentSong?.src
  const duration = decodedDuration && decodedDuration.source === source ? decodedDuration.value : metadataDuration

  useEffect(() => {
    if (!source) return
    const controller = new AbortController()
    getAudioDuration(source, controller.signal).then((value) => {
      if (!controller.signal.aborted) setDecodedDuration({ source, value })
    }).catch(() => {
      // Native metadata remains available for formats the Web Audio decoder cannot read.
    })
    return () => controller.abort()
  }, [source])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !source) return
    let active = true
    if (isPlaying) {
      setPlaybackError('')
      setIsLoading(audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA)
      audio.play().catch((error: DOMException) => {
        if (!active || error.name === 'AbortError') return
        setIsLoading(false)
        setPlaybackError('Não foi possível reproduzir o áudio. Tente novamente.')
        onPlaybackChange?.(false)
      })
    } else {
      audio.pause()
      setIsLoading(false)
    }
    return () => { active = false }
  }, [isPlaying, source, onPlaybackChange])

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0)
    setMetadataDuration(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value)
    if (audioRef.current && duration > 0 && Number.isFinite(newTime)) {
      audioRef.current.currentTime = Math.min(newTime, duration)
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleEnded = () => {
    if (onNext) {
      onNext()
    } else {
      onPlaybackChange?.(false)
    }
  }

  if (!currentSong) {
    return null
  } 

  return (
    <>
      <audio
        ref={audioRef}
        src={source}
        preload="auto"
        onLoadStart={() => { setCurrentTime(0); setMetadataDuration(0); setPlaybackError(''); setIsLoading(isPlaying) }}
        onDurationChange={handleTimeUpdate}
        onPlaying={() => { setIsLoading(false); onPlaybackChange?.(true) }}
        onWaiting={() => setIsLoading(isPlaying)}
        onError={() => { setIsLoading(false); setPlaybackError('Não foi possível carregar o áudio. Atualize o álbum e tente novamente.'); onPlaybackChange?.(false) }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      <div className={inline ? "w-full" : "z-50 max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:sticky sm:bottom-4 sm:mx-6"}>
        <div className="glass-effect rounded-2xl border border-spotify-green/20 p-3 sm:p-4 shadow-2xl backdrop-blur-xl bg-dark-800/60 relative">
          {playbackError && <p role="alert" className="mb-3 text-sm text-red-200">{playbackError}</p>}
          {isLoading && <p role="status" className="sr-only">Carregando áudio…</p>}
          {/* Mobile Layout */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className="text-white font-semibold text-sm break-words leading-tight">{currentSong.name}</h3>
                <p className="text-dark-300 text-xs truncate">{currentSong.tone}</p>
              </div>
              <button
                type="button"
                aria-label="Fechar player"
                hidden={!onClose}
                onClick={onClose}
                className="p-1 text-dark-300 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-center space-x-4 mb-3">
              <button
                type="button"
                aria-label="Música anterior"
                hidden={!onPrevious}
                onClick={onPrevious}
                disabled={!currentSong}
                className="p-2 text-dark-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
                onClick={onPlayPause}
                disabled={!currentSong}
                className="p-3 bg-white text-black rounded-full hover:scale-105 transition-transform disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              
              <button
                type="button"
                aria-label="Próxima música"
                hidden={!onNext}
                onClick={onNext}
                disabled={!currentSong}
                className="p-2 text-dark-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {currentSong && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-dark-400 w-10 text-right font-mono">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  aria-label="Posição do áudio"
                  disabled={!duration}
                  max={duration || 0}
                  value={duration ? Math.min(currentTime, duration) : 0}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    '--progress': duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                  } as React.CSSProperties}
                />
                <span className="text-xs text-dark-400 w-10 font-mono">
                  {duration ? formatTime(duration) : '—:—'}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-spotify-green to-spotify-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold truncate">{currentSong.name}</h3>
                  <p className="text-dark-300 text-sm truncate">{currentSong.tone}</p>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  aria-label="Música anterior"
                  hidden={!onPrevious}
                  onClick={onPrevious}
                  disabled={!currentSong}
                  className="p-2 text-dark-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                
                <button
                  type="button"
                  aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
                  onClick={onPlayPause}
                  disabled={!currentSong}
                  className="p-3 bg-white text-black rounded-full hover:scale-105 transition-transform disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                
                <button
                  type="button"
                  aria-label="Próxima música"
                  hidden={!onNext}
                  onClick={onNext}
                  disabled={!currentSong}
                  className="p-2 text-dark-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {currentSong && (
                <div className="flex items-center space-x-2 w-full">
                  <span className="text-xs text-dark-400 w-12 text-right font-mono">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    aria-label="Posição do áudio"
                    disabled={!duration}
                    max={duration || 0}
                    value={duration ? Math.min(currentTime, duration) : 0}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      '--progress': duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                    } as React.CSSProperties}
                  />
                  <span className="text-xs text-dark-400 w-12 font-mono">
                    {duration ? formatTime(duration) : '—:—'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <button
                type="button"
                aria-label="Fechar player"
                hidden={!onClose}
                onClick={onClose}
                className="p-2 text-dark-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MusicPlayer
