'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import PlaylistCard from './PlaylistCard'

interface PlaylistSectionProps {
  playlists: string[]
  selectedPlaylist: string | null
  onPlaylistSelect: (name: string) => void
}

const PlaylistSection = ({
  playlists,
  selectedPlaylist,
  onPlaylistSelect,
}: PlaylistSectionProps) => {
  const trackRef = useRef<HTMLUListElement | null>(null)
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollControls = useCallback(() => {
    const track = trackRef.current
    if (!track) {
      setCanScrollPrevious(false)
      setCanScrollNext(false)
      return
    }

    const tolerance = 2
    setCanScrollPrevious(track.scrollLeft > tolerance)
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - tolerance)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    updateScrollControls()
    track.addEventListener('scroll', updateScrollControls, { passive: true })
    window.addEventListener('resize', updateScrollControls)

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateScrollControls)
    resizeObserver?.observe(track)

    return () => {
      track.removeEventListener('scroll', updateScrollControls)
      window.removeEventListener('resize', updateScrollControls)
      resizeObserver?.disconnect()
    }
  }, [playlists, updateScrollControls])

  useEffect(() => {
    if (!selectedPlaylist) return
    const selectedCard = trackRef.current?.querySelector<HTMLElement>('[data-selected="true"]')
    selectedCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [selectedPlaylist])

  const scroll = (direction: 'previous' | 'next') => {
    const track = trackRef.current
    if (!track) return

    track.scrollBy({
      left: track.clientWidth * 0.85 * (direction === 'previous' ? -1 : 1),
      behavior: 'smooth',
    })
  }

  if (playlists.length === 0) {
    return null
  }

  return (
    <section className="mb-10" aria-labelledby="playlists-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="playlists-title" className="text-2xl font-bold text-white">
            Playlists
          </h2>
          <p id="playlists-description" className="mt-1 text-sm text-dark-300">
            Selecione uma playlist para filtrar as músicas.
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex" aria-label="Controles do carrossel">
          <button
            type="button"
            onClick={() => scroll('previous')}
            disabled={!canScrollPrevious}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-dark-600 bg-dark-800 text-white transition-colors hover:border-dark-400 hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Ver playlists anteriores"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scroll('next')}
            disabled={!canScrollNext}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-dark-600 bg-dark-800 text-white transition-colors hover:border-dark-400 hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Ver próximas playlists"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        aria-labelledby="playlists-title"
        aria-describedby="playlists-description"
        tabIndex={0}
        className="flex snap-x snap-mandatory scroll-px-1 gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 pr-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green"
      >
        {playlists.map((playlist) => (
          <li
            key={playlist}
            data-selected={selectedPlaylist === playlist}
            className="w-[72vw] max-w-52 shrink-0 snap-start sm:w-48 lg:w-52"
          >
            <PlaylistCard
              name={playlist}
              isSelected={selectedPlaylist === playlist}
              onSelect={onPlaylistSelect}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default PlaylistSection
