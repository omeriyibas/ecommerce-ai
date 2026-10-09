import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,                 // hata alırsa 1 kez yeniden dene
            refetchOnWindowFocus: false, // pencere değişince yeniden çağırma
            staleTime: 1000 * 60,     // 1 dk boyunca “fresh” kabul et
        },
        mutations: {
            retry: false,             // mutasyon hata verirse tekrar etme
        },
    },
})
