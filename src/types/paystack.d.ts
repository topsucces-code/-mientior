declare module 'paystack' {
  interface PaystackResponse<T = unknown> {
    status: boolean
    message?: string
    data: T
  }

  interface TransactionInitializeData {
    authorization_url: string
    access_code: string
    reference: string
  }

  interface TransactionVerifyData {
    id: number
    domain: string
    status: string
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: Record<string, unknown>
    customer: {
      id: number
      email: string
      customer_code: string
    }
  }

  interface TransactionInitializeOptions {
    email: string
    amount: number
    currency?: string
    callback_url?: string
    metadata?: Record<string, unknown>
  }

  interface PaystackInstance {
    transaction: {
      initialize(
        options: TransactionInitializeOptions
      ): Promise<PaystackResponse<TransactionInitializeData>>
      verify(reference: string): Promise<PaystackResponse<TransactionVerifyData>>
    }
  }

  function Paystack(secretKey: string): PaystackInstance

  export = Paystack
}
