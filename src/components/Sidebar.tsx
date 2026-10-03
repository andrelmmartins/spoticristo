'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Music, Menu, X, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useAlbum } from '@/contexts/AlbumContext'

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { albums, isLoadingAlbums } = useAlbum()
  const pathname = usePathname()

  const menuItems = [
    { icon: Home, label: 'Início', href: '/' },
  ]

  return (
    <>
        <button
            className="lg:hidden fixed top-4 left-4 z-50 p-3 glass-effect rounded-xl text-white hover:scale-105 transition-all duration-200 shadow-lg border border-spotify-green/20"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 h-dvh bg-dark-900 border-r border-dark-700 flex flex-col
        fixed lg:relative z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gradient-to-br from-spotify-green to-spotify-green-light rounded-lg flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">SpotiCristo</span>
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-4 px-4 py-2 rounded-lg transition-colors duration-200 group ${
                    isActive
                      ? 'text-white bg-spotify-green/20 border border-spotify-green/30'
                      : 'text-dark-200 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-spotify-green'
                      : 'group-hover:text-spotify-green'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          <div className="px-4 mb-4">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
              Álbuns
            </h3>
          </div>
          
          {isLoadingAlbums ? (
            <div className="px-4 space-y-1 w-full">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-center space-x-4 py-2 rounded-lg">
                    <div className="w-8 h-8 bg-dark-700 rounded flex-shrink-0"></div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="h-4 bg-dark-700 rounded w-3/4"></div>
                      <div className="h-3 bg-dark-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-4">
              {albums.map((album) => (
                <li key={album.id}>
                  <Link
                    href={`/${album.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-4 px-4 py-2 rounded-lg text-dark-200 hover:text-white hover:bg-dark-800 transition-colors duration-200 group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-dark-600 to-dark-700 rounded flex items-center justify-center flex-shrink-0">
                      {album.banner ? (
                        <img
                          src={album.banner}
                          alt={album.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Music className="w-4 h-4 text-dark-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium truncate block text-sm group-hover:text-spotify-green transition-colors">
                        {album.name}
                      </span>
                      {album.tags.length > 0 && (
                        <span className="text-xs text-dark-400 truncate block">
                          {album.tags.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

      </nav>

        <div className="p-4 border-t border-dark-700">
          <a
            href="https://instagram.com/andrelmmartins"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 text-xs text-dark-400 hover:text-spotify-green transition-colors group"
          >
            <span>by André Martins</span>
            <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>
    </>
  )
}

export default Sidebar
