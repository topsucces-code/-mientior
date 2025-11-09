import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderEmailData {
  orderNumber: string
  email: string
}

interface UserEmailData {
  email: string
}

export async function sendOrderConfirmation(order: OrderEmailData, user: UserEmailData) {
  // Use React Email template (to be implemented)
  return resend.emails.send({
    from: 'orders@mientior.com',
    to: user.email,
    subject: `Order confirmation #${order.orderNumber}`,
    html: '<p>Thank you for your order!</p>'
  })
}

export async function sendWelcomeEmail(user: UserEmailData) {
  return resend.emails.send({
    from: 'hello@mientior.com',
    to: user.email,
    subject: 'Welcome to Mientior!',
    html: '<p>Welcome!</p>'
  })
}

export async function sendShippingNotification(order: OrderEmailData, trackingNumber: string) {
  return resend.emails.send({
    from: 'shipping@mientior.com',
    to: order.email,
    subject: `Your order #${order.orderNumber} has shipped`,
    html: `<p>Tracking: ${trackingNumber}</p>`
  })
}
