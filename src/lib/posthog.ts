import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug()
      },
      capture_pageview: false, // We handle this manually in Next.js
    })
  }
}

export const analytics = {
  capture: (eventName: string, properties?: Record<string, unknown>) => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.capture(eventName, properties)
    }
  },
  
  identify: (userId: string, traits?: Record<string, unknown>) => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.identify(userId, traits)
    }
  },
  
  reset: () => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.reset()
    }
  }
}
