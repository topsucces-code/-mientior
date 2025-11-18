declare module 'flutterwave-node-v3' {
  interface FlutterwaveConfig {
    publicKey: string
    secretKey: string
  }

  interface Customer {
    email: string
    name: string
    phonenumber?: string
  }

  interface Customizations {
    title?: string
    description?: string
    logo?: string
  }

  interface ChargePayload {
    tx_ref: string
    amount: number
    currency: string
    redirect_url?: string
    payment_options?: string
    customer: Customer
    customizations?: Customizations
    meta?: Record<string, unknown>
  }

  interface FlutterwaveResponse {
    status: string
    message?: string
    data?: unknown
  }

  interface TransactionVerifyPayload {
    id: string
  }

  class Flutterwave {
    constructor(publicKey: string, secretKey: string)

    Charge: {
      card(payload: ChargePayload): Promise<FlutterwaveResponse>
    }

    Transaction: {
      verify(payload: TransactionVerifyPayload): Promise<FlutterwaveResponse>
    }
  }

  export default Flutterwave
}
