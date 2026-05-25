import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get listings expiring in 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const { data: listings, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:seller_id (name, email)
      `)
      .eq('status', 'active')
      .lte('expires_at', threeDaysFromNow.toISOString())
      .gt('expires_at', new Date().toISOString())

    if (error) throw error

    // Send expiration warning emails
    for (const listing of listings) {
      if (listing.profiles?.email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Arada Mart <noreply@aradamart.com>',
            to: listing.profiles.email,
            subject: `Your listing "${listing.title}" is expiring soon`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f59e0b;">Listing Expiring Soon</h1>
                <p>Hi ${listing.profiles.name},</p>
                <p>Your listing <strong>${listing.title}</strong> will expire in 3 days.</p>
                <p>Don't lose potential buyers! Renew your listing to keep it active for another 30 days.</p>
                <p>Log in to Arada Mart to renew your listing.</p>
                <p style="color: #666;">Best regards,<br>The Arada Mart Team</p>
              </div>
            `,
          }),
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: listings.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
