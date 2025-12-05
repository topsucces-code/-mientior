import { NextRequest, NextResponse } from 'next/server'
// Contact form API route

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, orderNumber, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Store contact message in database
    // Using a generic approach - you may want to create a ContactMessage model
    const contactData = {
      name,
      email,
      subject,
      orderNumber: orderNumber || null,
      message,
      createdAt: new Date(),
    }

    // For now, we'll log it and could send an email notification
    console.log('Contact form submission:', contactData)

    // If you have a ContactMessage model, uncomment this:
    // await prisma.contactMessage.create({ data: contactData })

    // You could also send an email notification here
    // await sendEmail({ to: 'support@mientior.com', subject: `Contact: ${subject}`, body: message })

    return NextResponse.json({ success: true, message: 'Message sent successfully' })
  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
