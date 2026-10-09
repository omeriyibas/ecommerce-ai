import { QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from './providers/store/store.tsx'
import { queryClient } from './providers/query/query-client.tsx'
import { AppRouterProvider } from './providers/router/app-router.tsx'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { bootstrapSession } from '@/services/auth.tsx'

function App() {
  useEffect(() => {
    void bootstrapSession()
  }, [])

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppRouterProvider />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </Provider>
  )
}

export default App
