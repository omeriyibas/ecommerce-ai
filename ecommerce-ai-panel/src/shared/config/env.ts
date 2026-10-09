export const config = {
  api: {
    baseURL:
      import.meta.env.MODE === 'development'
        ? (import.meta.env.VITE_API_URL as string)
        : (import.meta.env.VITE_PRODUCTION_API_URL as string),
  },
} as const

export type Config = typeof config
