import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { sendHtmlEmail } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const invoiceId = parseInt(id)

    if (Number.isNaN(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    // Fetch invoice with all details
    const invoice = await queryOne<any>(
      `SELECT 
        i.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone,
          'contact_type', c.contact_type,
          'address_line', c.address_line,
          'postal_code', c.postal_code,
          'city', c.city,
          'country', c.country,
          'vat_number', c.vat_number
        ) as contact,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ii.id,
              'description', ii.description,
              'quantity', ii.quantity,
              'unit', ii.unit,
              'unit_price', ii.unit_price,
              'discount', ii.discount,
              'line_total', ii.line_total
            )
          ) FILTER (WHERE ii.id IS NOT NULL),
          '[]'::json
        ) as items,
        json_build_object(
          'id', o.id,
          'company_name', o.company_name,
          'address_line', o.address_line,
          'postal_code', o.postal_code,
          'city', o.city,
          'country', o.country,
          'vat_number', o.vat_number,
          'email', o.email
        ) as organization
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      LEFT JOIN organizations o ON i.organization_id = o.id
      WHERE i.id = $1
      GROUP BY i.id, c.id, o.id`,
      [invoiceId]
    )

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (!invoice.contact?.email) {
      return NextResponse.json(
        { error: 'Contact email is required to send invoice' },
        { status: 400 }
      )
    }

    // Parse items if it's a string (JSON from database)
    let items = invoice.items || []
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch (e) {
        items = []
      }
    }
    
    // Parse contact and organization if they're strings
    let contact = invoice.contact || {}
    if (typeof contact === 'string') {
      try {
        contact = JSON.parse(contact)
      } catch (e) {
        contact = {}
      }
    }
    
    let organization = invoice.organization || {}
    if (typeof organization === 'string') {
      try {
        organization = JSON.parse(organization)
      } catch (e) {
        organization = {}
      }
    }
    const pdfUrl = `${process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin}/api/invoices/${invoiceId}/pdf`

    // Generate email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .invoice-details {
      background-color: #ffffff;
      border: 1px solid #ddd;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 5px;
      font-weight: bold;
    }
    .button-secondary {
      background-color: #6b7280;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
    .total {
      font-weight: bold;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>Invoice #${invoice.invoice_number}</h2>
    <p>From: ${organization.company_name || 'Company'}</p>
  </div>

  <div class="invoice-details">
    <p>Dear ${contact.name || 'Customer'},</p>
    <p>Please find attached your invoice #${invoice.invoice_number} dated ${formatDate(invoice.issue_date)}.</p>
    
    ${invoice.due_date ? `<p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>` : ''}
    ${invoice.payment_terms ? `<p><strong>Payment Terms:</strong> ${invoice.payment_terms}</p>` : ''}
    
    <h3>Invoice Summary:</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item: any) => `
          <tr>
            <td>${item.description || ''}</td>
            <td>${item.quantity || 0} ${item.unit || ''}</td>
            <td>${formatCurrency(item.unit_price || 0, invoice.currency)}</td>
            <td>${formatCurrency(item.line_total || 0, invoice.currency)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <p class="total">Total Amount: ${formatCurrency(invoice.total_amount || 0, invoice.currency)}</p>
    
    ${invoice.payment_link ? `
      <p style="margin-top: 20px;">
        <a href="${invoice.payment_link}" class="button">Pay Now</a>
      </p>
    ` : ''}
    
    <p style="margin-top: 20px;">
      <a href="${pdfUrl}" class="button button-secondary">View Full Invoice PDF</a>
    </p>
    
    ${invoice.bank_reg_no && invoice.bank_account_no ? `
      <p style="margin-top: 20px;">
        <strong>Bank Account:</strong> ${invoice.bank_reg_no} - ${invoice.bank_account_no}
      </p>
    ` : ''}
  </div>

  <p>If you have any questions, please don't hesitate to contact us.</p>
  <p>Thank you for your business!</p>
  
  <p style="margin-top: 30px; font-size: 12px; color: #666;">
    ${organization.company_name || 'Company'}<br>
    ${organization.email || ''}
  </p>
</body>
</html>
    `

    const emailText = `
Invoice #${invoice.invoice_number}

Dear ${contact.name || 'Customer'},

Please find your invoice #${invoice.invoice_number} dated ${formatDate(invoice.issue_date)}.

${invoice.due_date ? `Due Date: ${formatDate(invoice.due_date)}\n` : ''}
${invoice.payment_terms ? `Payment Terms: ${invoice.payment_terms}\n` : ''}

Invoice Summary:
${items.map((item: any) => `- ${item.description || ''}: ${item.quantity || 0} ${item.unit || ''} x ${formatCurrency(item.unit_price || 0, invoice.currency)} = ${formatCurrency(item.line_total || 0, invoice.currency)}`).join('\n')}

Total Amount: ${formatCurrency(invoice.total_amount || 0, invoice.currency)}

${invoice.payment_link ? `Payment Link: ${invoice.payment_link}\n` : ''}
View Full Invoice: ${pdfUrl}

${invoice.bank_reg_no && invoice.bank_account_no ? `Bank Account: ${invoice.bank_reg_no} - ${invoice.bank_account_no}\n` : ''}

Thank you for your business!

${organization.company_name || 'Company'}
${organization.email || ''}
    `

    // Send email
    await sendHtmlEmail(
      contact.email,
      `Invoice #${invoice.invoice_number} from ${organization.company_name || 'Company'}`,
      emailHtml,
      emailText,
      organization.email || undefined
    )

    // Update invoice status to 'sent' if it's currently 'draft'
    if (invoice.status === 'draft') {
      await queryOne(
        `UPDATE invoices SET status = 'sent', is_published = true, updated_at = now() WHERE id = $1`,
        [invoiceId]
      )
    }

    return NextResponse.json({ 
      message: 'Invoice sent successfully',
      sentTo: contact.email 
    })
  } catch (error: any) {
    console.error('Error sending invoice email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invoice email' },
      { status: 500 }
    )
  }
}

