import '../styles/globals.css'
import { NotificationProvider } from '../context/NotificationContext'

export default function App({ Component, pageProps }) {
  return (
    <NotificationProvider>
      <Component {...pageProps} />
    </NotificationProvider>
  )
}