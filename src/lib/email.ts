import nodemailer from 'nodemailer'

// MailerSend SMTP configuration
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: 587, // MailerSend SMTP port (587 for TLS, 465 for SSL)
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
      throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD environment variables.')
    }

    transporter = nodemailer.createTransport(smtpConfig)
  }

  return transporter
}

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
 * Send an email using MailerSend SMTP
 * @param options Email options (to, subject, text/html, etc.)
 * @returns Promise with message info
 */
export async function sendEmail(options: EmailOptions): Promise<nodemailer.SentMessageInfo> {
  try {
    const mailTransporter = getTransporter()

    const mailOptions = {
      from: options.from || process.env.SMTP_USERNAME,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      attachments: options.attachments,
    }

    const info = await mailTransporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}


export async function sendTextEmail(
  to: string | string[],
  subject: string,
  text: string,
  from?: string
): Promise<nodemailer.SentMessageInfo> {
  return sendEmail({ to, subject, text, from })
}


export async function sendHtmlEmail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string,
  from?: string
): Promise<nodemailer.SentMessageInfo> {
  return sendEmail({ to, subject, html, text, from })
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const mailTransporter = getTransporter()
    await mailTransporter.verify()
    console.log('SMTP connection verified successfully')
    return true
  } catch (error) {
    console.error('SMTP connection verification failed:', error)
    return false
  }
}

