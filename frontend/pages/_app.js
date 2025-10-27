// pages/_app.js - UPDATED
import '../styles/globals.css'
import { NotificationProvider } from '../context/NotificationContext'
import GlobalAchievementToasts from '../components/GlobalAchievementToasts'

export default function App({ Component, pageProps }) {
  return (
    <NotificationProvider>
      <GlobalAchievementToasts />
      <Component {...pageProps} />
    </NotificationProvider>
  )
}