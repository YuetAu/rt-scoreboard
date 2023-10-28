import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import { SnackbarProvider } from 'notistack'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <SnackbarProvider 
        autoHideDuration={1000}
      >
      <Component {...pageProps} />
      </SnackbarProvider>
    </ChakraProvider>
  )
}
