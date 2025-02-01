import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | ProveIt',
    default: 'ProveIt'
  },
  description: 'Complete tasks and prove your accomplishments',
  icons: {
    icon: [
      { url: '/P.svg', type: 'image/svg+xml' },
      { url: '/P.png', type: 'image/png' } // Optional fallback
    ],
    apple: '/apple-icon.png' // Optional iOS icon
  },
  manifest: '/site.webmanifest' // Optional PWA manifest
}; 