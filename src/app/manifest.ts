import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Grace Billiris Portfolio',
    short_name: 'Grace Portfolio',
    description: 'Personal portfolio website of Grace Billiris',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a192f',
    theme_color: '#64ffda',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}