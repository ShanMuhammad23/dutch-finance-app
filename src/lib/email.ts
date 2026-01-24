import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content?: string | Buffer
    path?: string
    contentType?: string
  }>
}

/**
 * Send an email using Resend
 * @param options Email options (to, subject, text/html, etc.)
 * @returns Promise with message info
 */
export async function sendEmail(options: EmailOptions): Promise<{ id: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    // Always use Resend verified domain for 'from' address
    // Use organization email as reply-to instead
    const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || 'delivered@resend.dev'
    
    // Convert attachments if provided
    const attachments = options.attachments?.map(att => ({
      filename: att.filename,
      content: typeof att.content === 'string' 
        ? Buffer.from(att.content, 'utf-8').toString('base64')
        : att.content instanceof Buffer
        ? att.content.toString('base64')
        : undefined,
      content_type: att.contentType,
    })).filter(att => att.content !== undefined)

    const result = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    } as any)

    console.log('Email sent successfully:', result.data?.id)
    return { id: result.data?.id || 'unknown' }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

/**
 * Send a plain text email using Resend
 */
export async function sendTextEmail(
  to: string | string[],
  subject: string,
  text: string,
  from?: string
): Promise<{ id: string }> {
  return sendEmail({ to, subject, text, from })
}

/**
 * Send an HTML email using Resend
 */
export async function sendHtmlEmail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string,
  from?: string
): Promise<{ id: string }> {
  return sendEmail({ to, subject, html, text, from })
}

/**
 * Verify Resend API key is configured
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return false
    }
    console.log('Resend API key is configured')
    return true
  } catch (error) {
    console.error('Resend connection verification failed:', error)
    return false
  }
}
