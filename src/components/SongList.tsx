'use client'

import { Song } from '@/@types/interfaces'
import { MoreVertical, Play, Pause } from 'lucide-react'

interface SongListProps {
  songs: Song[]
  currentSong: Song | null
  isPlaying: boolean
  onSongSelect: (song: Song) => void
  onPlayPause: () => void
  editableSongIds?: Set<string>
  onEditSong?: (song: Song) => void
}

const SongList = ({ songs, currentSong, isPlaying, onSongSelect, onPlayPause, editableSongIds, onEditSong }: SongListProps) => {
  const handleSongClick = (song: Song) => {
    if (currentSong?.id === song.id) {
      onPlayPause()
    } else {
      onSongSelect(song)
    }
  }


  return (
    <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg border border-dark-700 overflow-hidden">
      {/* Header - Hidden on mobile */}
      <div className="hidden sm:block px-4 lg:px-8 py-4 border-b border-dark-700">
        <div className="grid grid-cols-11 gap-4 text-sm text-dark-400 font-medium items-center">
          <div className="col-span-1 flex justify-center">
            <span className="text-lg">#</span>
          </div>
          <div className="col-span-5">TÍTULO</div>
          <div className="col-span-3">TOM</div>
          <div className="col-span-2">TAGS</div>
        </div>
      </div>

      <div className="divide-y divide-dark-700">
        {songs.map((song, index) => {
          const isCurrentSong = currentSong?.id === song.id
          const isPlayingCurrent = isCurrentSong && isPlaying
          const isEditable = editableSongIds?.has(song.id)

          return (
            <div
              key={song.id}
              onClick={() => handleSongClick(song)}
              className={`
                group px-4 sm:px-8 py-3 sm:py-4 hover:bg-dark-700/50 transition-colors cursor-pointer
                ${isCurrentSong ? 'bg-dark-700/30' : ''} ${isEditable ? 'border-l-2 border-l-spotify-green bg-spotify-green/5' : ''}
              `}
            >
              {/* Desktop Layout */}
              <div className="hidden sm:grid grid-cols-11 gap-4 items-center">
                <div className="col-span-1 flex justify-center">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {isCurrentSong ? (
                      isPlayingCurrent ? (
                        <Pause className="w-4 h-4 text-spotify-green" />
                      ) : (
                        <Play className="w-4 h-4 text-spotify-green" />
                      )
                    ) : (
                      <>
                        <span className="text-dark-400 group-hover:hidden text-sm">
                          {index + 1}
                        </span>
                        <Play className="hidden group-hover:block w-4 h-4 text-white hover:text-spotify-green transition-colors" />
                      </>
                    )}
                  </div>
                </div>

                <div className="col-span-5">
                  <div className="flex items-center space-x-4">
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <h3 className={`font-medium break-words ${
                        isCurrentSong ? 'text-spotify-green' : 'text-white'
                      }`}>
                        {song.name}
                      </h3>
                      {isEditable && <span className="rounded-full border border-spotify-green/30 bg-spotify-green/10 px-2 py-0.5 text-[10px] font-semibold text-spotify-green">Sua gravação</span>}
                    </div>
                  </div>
                </div>

                <div className="col-span-3">
                  <span className="text-dark-300 text-sm">{song.tone}</span>
                </div>

                <div className="col-span-2 min-w-0 flex items-center gap-1">
                  <div className="flex flex-wrap gap-1">
                    {song.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 text-xs bg-dark-600 text-dark-200 rounded-full max-w-full truncate"
                      >
                        {tag}
                      </span>
                    ))}
                    {song.tags.length > 2 && (
                      <span className="px-2 py-1 text-xs bg-dark-600 text-dark-200 rounded-full">
                        +{song.tags.length - 2}
                      </span>
                    )}
                  </div>
                  {isEditable && onEditSong && <button type="button" onClick={(event) => { event.stopPropagation(); onEditSong(song); }} className="ml-auto rounded-full p-2 text-dark-300 hover:bg-dark-600 hover:text-white" aria-label={`Editar ${song.name}`}><MoreVertical className="h-4 w-4" /></button>}
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="sm:hidden">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {isCurrentSong ? (
                      isPlayingCurrent ? (
                        <Pause className="w-4 h-4 text-spotify-green" />
                      ) : (
                        <Play className="w-4 h-4 text-spotify-green" />
                      )
                    ) : (
                      <>
                        <span className="text-dark-400 group-hover:hidden text-sm">
                          {index + 1}
                        </span>
                        <Play className="hidden group-hover:block w-4 h-4 text-white hover:text-spotify-green transition-colors" />
                      </>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-1"><h3 className={`font-medium text-sm break-words leading-tight ${
                      isCurrentSong ? 'text-spotify-green' : 'text-white'
                    }`}>
                      {song.name}
                    </h3>{isEditable && <span className="rounded-full border border-spotify-green/30 px-1.5 py-0.5 text-[9px] text-spotify-green">Sua</span>}{isEditable && onEditSong && <button type="button" onClick={(event) => { event.stopPropagation(); onEditSong(song); }} className="-mt-1 ml-auto shrink-0 rounded-full p-1 text-dark-300 hover:text-white" aria-label={`Editar ${song.name}`}><MoreVertical className="h-4 w-4" /></button>}</div>
                    <div className="flex flex-wrap items-center gap-1 mt-1 min-w-0">
                      <span className="text-dark-300 text-xs shrink-0">{song.tone}</span>
                      {song.tags.length > 0 && (
                        <span className="text-dark-400 text-xs shrink-0">•</span>
                      )}
                      {song.tags.slice(0, 1).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-0.5 text-xs bg-dark-600 text-dark-200 rounded-full max-w-[8rem] truncate"
                        >
                          {tag}
                        </span>
                      ))}
                      {song.tags.length > 1 && (
                        <span className="text-xs text-dark-400">
                          +{song.tags.length - 1}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SongList
