// pages/_app.js
import '../styles/globals.css'
import { NotificationProvider } from '../context/NotificationContext'
import GlobalAchievementToasts from '../components/GlobalAchievementToasts'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChangeError = (err, url) => {
      if (err.cancelled) {
        console.log(`Route to ${url} was cancelled!`)
      }
    }

    router.events.on('routeChangeError', handleRouteChangeError)
    return () => {
      router.events.off('routeChangeError', handleRouteChangeError)
    }
  }, [router])

  return (
    <NotificationProvider>
      <GlobalAchievementToasts />
      <Component {...pageProps} key={router.asPath} />
    </NotificationProvider>
  )
}