import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  register: true,
  reloadOnOnline: true,
})

const nextConfig: NextConfig = {
  // App Router is default in Next.js 15+
}

export default withSerwist(nextConfig)
