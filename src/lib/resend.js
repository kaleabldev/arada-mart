const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY

export async function sendEmail({ to, subject, html }) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Arada Mart <noreply@aradamart.com>',
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    return await response.json()
  } catch (error) {
    console.error('Email error:', error)
    throw error
  }
}

export async function sendWelcomeEmail(email, name) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0ea5e9;">Welcome to Arada Mart!</h1>
      <p>Hi ${name},</p>
      <p>Welcome to Arada Mart - your trusted marketplace for buying and selling used electronics in Ethiopia.</p>
      <p>You can now:</p>
      <ul>
        <li>Post up to 1 free listing</li>
        <li>Browse electronics from other sellers</li>
        <li>Chat directly with buyers and sellers</li>
      </ul>
      <p>Get started by posting your first listing or browsing our marketplace!</p>
      <p style="color: #666;">Best regards,<br>The Arada Mart Team</p>
    </div>
  `
  return sendEmail({ to: email, subject: 'Welcome to Arada Mart!', html })
}

export async function sendNewMessageEmail(recipientEmail, recipientName, senderName, listingTitle) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0ea5e9;">New Message Received</h1>
      <p>Hi ${recipientName},</p>
      <p>You have received a new message from ${senderName} regarding your listing: <strong>${listingTitle}</strong></p>
      <p>Log in to Arada Mart to view and respond to the message.</p>
      <p style="color: #666;">Best regards,<br>The Arada Mart Team</p>
    </div>
  `
  return sendEmail({ to: recipientEmail, subject: 'New Message on Arada Mart', html })
}

export async function sendExpirationWarningEmail(email, name, listingTitle, daysLeft) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #f59e0b;">Listing Expiring Soon</h1>
      <p>Hi ${name},</p>
      <p>Your listing <strong>${listingTitle}</strong> will expire in ${daysLeft} days.</p>
      <p>Don't lose potential buyers! Renew your listing to keep it active for another 30 days.</p>
      <p>Log in to Arada Mart to renew your listing.</p>
      <p style="color: #666;">Best regards,<br>The Arada Mart Team</p>
    </div>
  `
  return sendEmail({ to: email, subject: `Your listing "${listingTitle}" is expiring soon`, html })
}
