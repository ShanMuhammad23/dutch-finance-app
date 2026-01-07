import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function GET(
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
          'email', o.email,
          'logo', o.logo
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

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${invoice.invoice_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }
    .company-info h1 {
      font-size: 24px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 28px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .bill-to {
      margin-bottom: 30px;
    }
    .bill-to h3 {
      font-size: 16px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #f5f5f5;
      padding: 12px;
      text-align: left;
      border: 1px solid #ddd;
      font-weight: bold;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #ddd;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-bottom: 30px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totals-row.total {
      border-top: 2px solid #333;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
    }
    .payment-info {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    .payment-info h3 {
      margin-bottom: 15px;
      font-size: 16px;
    }
    .payment-link {
      display: inline-block;
      margin-top: 15px;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .comments {
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      ${organization.logo ? `<img src="${organization.logo.startsWith('/') ? organization.logo : `/attachments/${organization.logo}`}" alt="${organization.company_name}" style="height: 60px; margin-bottom: 15px;" />` : ''}
      <h1>${organization.company_name || 'Company Name'}</h1>
      ${organization.address_line ? `<p>${organization.address_line}${organization.postal_code ? `, ${organization.postal_code}` : ''}${organization.city ? ` ${organization.city}` : ''}${organization.country ? `, ${organization.country}` : ''}</p>` : ''}
      ${organization.vat_number ? `<p>VAT: ${organization.vat_number}</p>` : ''}
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
      <p><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</p>
      ${invoice.due_date ? `<p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>` : ''}
      <p><strong>Status:</strong> ${invoice.status?.toUpperCase() || 'DRAFT'}</p>
    </div>
  </div>

  ${contact.name ? `
  <div class="bill-to">
    <h3>Bill To:</h3>
    <p><strong>${contact.name}</strong></p>
    ${contact.email ? `<p>${contact.email}</p>` : ''}
    ${contact.phone ? `<p>${contact.phone}</p>` : ''}
    ${contact.address_line ? `<p>${contact.address_line}${contact.postal_code ? `, ${contact.postal_code}` : ''}${contact.city ? ` ${contact.city}` : ''}${contact.country ? `, ${contact.country}` : ''}</p>` : ''}
    ${contact.vat_number ? `<p>VAT: ${contact.vat_number}</p>` : ''}
  </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-center">Quantity</th>
        <th class="text-center">Unit</th>
        <th class="text-right">Unit Price</th>
        <th class="text-center">Discount</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any) => `
        <tr>
          <td>${item.description || ''}</td>
          <td class="text-center">${item.quantity || 0}</td>
          <td class="text-center">${item.unit || ''}</td>
          <td class="text-right">${formatCurrency(item.unit_price || 0, invoice.currency)}</td>
          <td class="text-center">${item.discount || 0}%</td>
          <td class="text-right">${formatCurrency(item.line_total || 0, invoice.currency)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(invoice.subtotal || 0, invoice.currency)}</span>
    </div>
    ${invoice.discount_total > 0 ? `
    <div class="totals-row">
      <span>Discount:</span>
      <span>-${formatCurrency(invoice.discount_total || 0, invoice.currency)}</span>
    </div>
    ` : ''}
    ${invoice.tax_total > 0 ? `
    <div class="totals-row">
      <span>Tax:</span>
      <span>${formatCurrency(invoice.tax_total || 0, invoice.currency)}</span>
    </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total:</span>
      <span>${formatCurrency(invoice.total_amount || 0, invoice.currency)}</span>
    </div>
  </div>

  <div class="payment-info">
    <h3>Payment Information</h3>
    ${invoice.bank_reg_no && invoice.bank_account_no ? `
      <p>Bank Account: ${invoice.bank_reg_no} - ${invoice.bank_account_no}</p>
    ` : ''}
    ${invoice.payment_terms ? `
      <p>Payment Terms: ${invoice.payment_terms}</p>
    ` : ''}
    <div style="margin-top: 15px;">
      ${invoice.payment_link ? `
        <a href="${invoice.payment_link}" class="payment-link" target="_blank">Payment Link</a>
      ` : `
        <a href="#" class="payment-link" style="pointer-events: none; opacity: 0.6; cursor: default;">Payment Link</a>
      `}
    </div>
  </div>

  ${invoice.comments ? `
  <div class="comments">
    <h3>Comments</h3>
    <p>${invoice.comments.replace(/\n/g, '<br>')}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
    `

    // Return HTML that can be converted to PDF by the browser
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.html"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

