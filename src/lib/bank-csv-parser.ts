/**
 * CSV and XLSX Parser for Danish Bank Statements
 * Supports common formats from Danske Bank, Nordea, Jyske Bank, etc.
 */

import { ParsedBankTransaction, BankStatementUpload } from './types'

// Dynamic import for xlsx library (to avoid SSR issues)
let XLSX: any = null
async function getXLSX() {
  if (typeof window === 'undefined') {
    return null
  }
  if (!XLSX) {
    try {
      XLSX = await import('xlsx')
    } catch (error) {
      console.error('Failed to load xlsx library:', error)
      return null
    }
  }
  return XLSX
}

// Common Danish bank CSV column mappings
const COLUMN_MAPPINGS = {
  // Date columns
  date: ['dato', 'date', 'transaktionsdato', 'valørdato', 'value date', 'bogføringsdato', 'transaction date'],
  valueDate: ['valørdato', 'value date', 'valuta', 'værdidato', 'payment date', 'record date'],
  
  // Description columns
  description: ['tekst', 'beskrivelse', 'description', 'text', 'transaktionstekst', 'note', 'notat', 'details'],
  
  // Amount columns
  amount: ['beløb', 'amount', 'beløb i valuta', 'beløb i dkk', 'kr'],
  debit: ['debit', 'udgift', 'udbetaling', 'ud', 'minus', 'withdrawal'],
  credit: ['credit', 'indtægt', 'indbetaling', 'ind', 'plus', 'deposit'],
  
  // Balance columns
  balance: ['saldo', 'balance', 'disponibelt', 'tilgængeligt'],
  
  // Reference columns
  reference: ['reference', 'ref', 'reference nummer', 'reference nr', 'reference number'],
  
  // Counterparty columns
  counterparty: ['modpart', 'modparti', 'counterparty', 'navn', 'name', 'modtager', 'afsender'],
  
  // Account columns
  account: ['konto', 'account', 'kontonummer', 'account number', 'regnr', 'kontonr'],
  
  // Currency columns
  currency: ['valuta', 'currency', 'valutakode'],
}

/**
 * Normalize column name for matching
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Find column index by matching against known column names
 */
function findColumnIndex(headers: string[], mappings: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeColumnName(headers[i])
    for (const mapping of mappings) {
      if (normalized.includes(mapping.toLowerCase()) || mapping.toLowerCase().includes(normalized)) {
        return i
      }
    }
  }
  return -1
}

/**
 * Parse various date formats (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MMM-YY, etc.)
 */
function parseDanishDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null
  
  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split(' ')[0] // Take date part only
  }
  
  // Try DD-MMM-YY or DD-MMM-YYYY (e.g., "28-Apr-17" or "28-Apr-2017")
  const dmyMatch = dateStr.match(/^(\d{1,2})[-\/](\w{3})[-\/](\d{2,4})/i)
  if (dmyMatch) {
    const [, day, monthStr, yearStr] = dmyMatch
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthStr.toLowerCase().substring(0, 3))
    
    if (monthIndex !== -1) {
      const month = String(monthIndex + 1).padStart(2, '0')
      let year = yearStr
      
      // Handle 2-digit year
      if (year.length === 2) {
        const yearNum = parseInt(year, 10)
        // Assume years 00-30 are 2000-2030, 31-99 are 1931-1999
        year = yearNum <= 30 ? `20${year}` : `19${year}`
      }
      
      return `${year}-${month}-${day.padStart(2, '0')}`
    }
  }
  
  // Try DD-MM-YYYY or DD/MM/YYYY
  const dmyNumericMatch = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/)
  if (dmyNumericMatch) {
    const [, day, month, year] = dmyNumericMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // Try YYYY-MM-DD
  const ymdMatch = dateStr.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})/)
  if (ymdMatch) {
    return ymdMatch[0]
  }
  
  return null
}

/**
 * Parse amount (handles Danish number format with comma as decimal separator, and currency symbols)
 */
function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') return 0
  
  // Remove currency symbols, spaces, and CR/DR suffixes
  let cleaned = amountStr
    .replace(/[^\d,.\-\s]/g, '')
    .replace(/\s*(CR|DR)\s*/gi, '')
    .trim()
  
  // Handle Danish format: 1.234,56 or 1234,56
  // Or international format: 1,234.56 or 1234.56
  if (cleaned.includes(',')) {
    // Check if comma is decimal separator (if there are dots before comma, they're thousands separators)
    if (cleaned.includes('.')) {
      // Danish format: comma is decimal separator, dots are thousands
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // Could be either format - try comma as decimal first
      cleaned = cleaned.replace(',', '.')
    }
  }
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Determine transaction type from amount
 */
function getTransactionType(amount: number): 'debit' | 'credit' {
  return amount >= 0 ? 'credit' : 'debit'
}

/**
 * Parse CSV content into bank transactions
 */
export function parseBankStatementCSV(
  csvContent: string,
  filename: string
): BankStatementUpload {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }
  
  // Detect delimiter (comma, semicolon, or tab)
  let delimiter = ','
  if (lines[0].includes(';')) {
    delimiter = ';'
  } else if (lines[0].includes('\t')) {
    delimiter = '\t'
  }
  
  // Find header row - skip account info rows
  let headerRowIndex = 0
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]
    const headers = line.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''))
    const normalizedHeaders = headers.map(h => normalizeColumnName(h))
    
    // Check if this looks like a header row (contains common header keywords)
    if (normalizedHeaders.some(h => 
      h.includes('date') || h.includes('dato') || 
      h.includes('description') || h.includes('beskrivelse') ||
      h.includes('debit') || h.includes('credit') || h.includes('amount')
    )) {
      headerRowIndex = i
      break
    }
  }
  
  // Parse header
  const headerLine = lines[headerRowIndex]
  const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''))
  
  // Find column indices
  const dateIndex = findColumnIndex(headers, COLUMN_MAPPINGS.date)
  const valueDateIndex = findColumnIndex(headers, COLUMN_MAPPINGS.valueDate)
  const descriptionIndex = findColumnIndex(headers, COLUMN_MAPPINGS.description)
  const amountIndex = findColumnIndex(headers, COLUMN_MAPPINGS.amount)
  const debitIndex = findColumnIndex(headers, COLUMN_MAPPINGS.debit)
  const creditIndex = findColumnIndex(headers, COLUMN_MAPPINGS.credit)
  const balanceIndex = findColumnIndex(headers, COLUMN_MAPPINGS.balance)
  const referenceIndex = findColumnIndex(headers, COLUMN_MAPPINGS.reference)
  const counterpartyIndex = findColumnIndex(headers, COLUMN_MAPPINGS.counterparty)
  const accountIndex = findColumnIndex(headers, COLUMN_MAPPINGS.account)
  const currencyIndex = findColumnIndex(headers, COLUMN_MAPPINGS.currency)
  
  // Validate required columns
  if (dateIndex === -1) {
    throw new Error('Could not find date column. Expected columns: Dato, Date, Transaktionsdato')
  }
  
  if (descriptionIndex === -1) {
    throw new Error('Could not find description column. Expected columns: Tekst, Beskrivelse, Description')
  }
  
  if (amountIndex === -1 && debitIndex === -1 && creditIndex === -1) {
    throw new Error('Could not find amount column. Expected columns: Beløb, Amount, Debit, Credit')
  }
  
  // Parse transactions (start after header row)
  const transactions: ParsedBankTransaction[] = []
  const dates: string[] = []
  let totalDebits = 0
  let totalCredits = 0
  let detectedCurrency = 'DKK'
  let detectedAccount: string | undefined
  
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    
    // Parse CSV line (handle quoted values and tabs)
    const values: string[] = []
    
    // For tab-delimited, simple split works better
    if (delimiter === '\t') {
      values.push(...line.split('\t').map(v => v.trim().replace(/^["']|["']$/g, '')))
    } else {
      // For comma/semicolon, handle quoted values
      let current = ''
      let inQuotes = false
      const quoteChar = line.includes('"') ? '"' : "'"
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === quoteChar) {
          inQuotes = !inQuotes
        } else if ((char === delimiter || (delimiter === ',' && char === ',')) && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''))
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, '')) // Add last value
    }
    
    // Extract values
    const transactionDate = dateIndex >= 0 ? values[dateIndex] || '' : ''
    const valueDate = valueDateIndex >= 0 ? values[valueDateIndex] || '' : ''
    const description = descriptionIndex >= 0 ? values[descriptionIndex] || '' : ''
    const amountStr = amountIndex >= 0 ? values[amountIndex] || '' : ''
    const debitStr = debitIndex >= 0 ? values[debitIndex] || '' : ''
    const creditStr = creditIndex >= 0 ? values[creditIndex] || '' : ''
    const balanceStr = balanceIndex >= 0 ? values[balanceIndex] || '' : ''
    const reference = referenceIndex >= 0 ? values[referenceIndex] || '' : ''
    const counterparty = counterpartyIndex >= 0 ? values[counterpartyIndex] || '' : ''
    const account = accountIndex >= 0 ? values[accountIndex] : undefined
    const currency = currencyIndex >= 0 ? values[currencyIndex] : undefined
    
    // Parse dates
    const parsedDate = parseDanishDate(transactionDate)
    if (!parsedDate) {
      continue // Skip invalid rows
    }
    
    dates.push(parsedDate)
    
    // Parse amount - prioritize separate debit/credit columns
    let amount = 0
    if (debitIndex >= 0 && debitStr && debitStr.trim() !== '') {
      // Debit is negative
      const debitAmount = parseAmount(debitStr)
      if (debitAmount > 0) {
        amount = -debitAmount
      }
    } else if (creditIndex >= 0 && creditStr && creditStr.trim() !== '') {
      // Credit is positive
      const creditAmount = parseAmount(creditStr)
      if (creditAmount > 0) {
        amount = creditAmount
      }
    } else if (amountIndex >= 0 && amountStr) {
      // Single amount column (positive = credit, negative = debit)
      amount = parseAmount(amountStr)
    }
    
    // Skip rows with no amount and no date
    if (amount === 0 && !parsedDate) {
      continue
    }
    
    // Parse balance (remove CR/DR suffix)
    const balance = balanceStr ? parseAmount(balanceStr) : undefined
    
    // Detect currency
    if (currency && !detectedCurrency) {
      detectedCurrency = currency.trim().toUpperCase()
    }
    
    // Detect account
    if (account && !detectedAccount) {
      detectedAccount = account.trim()
    }
    
    // Calculate totals
    if (amount < 0) {
      totalDebits += Math.abs(amount)
    } else {
      totalCredits += amount
    }
    
    // Validate transaction
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!description.trim()) {
      warnings.push('Missing description')
    }
    
    if (amount === 0) {
      warnings.push('Zero amount transaction')
    }
    
    // Parse value date
    const parsedValueDate = valueDate ? parseDanishDate(valueDate) : undefined
    
    transactions.push({
      transaction_date: parsedDate,
      value_date: parsedValueDate || undefined,
      description: description.trim(),
      amount,
      balance,
      reference: reference.trim() || undefined,
      counterparty: counterparty.trim() || undefined,
      account_number: account?.trim() || undefined,
      currency: currency?.trim().toUpperCase() || detectedCurrency,
      transaction_type: getTransactionType(amount),
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    })
  }
  
  // Calculate date range
  const sortedDates = dates.sort()
  const dateRange = {
    start: sortedDates[0] || new Date().toISOString().split('T')[0],
    end: sortedDates[sortedDates.length - 1] || new Date().toISOString().split('T')[0],
  }
  
  return {
    filename,
    uploaded_at: new Date().toISOString(),
    transactions,
    total_debits: totalDebits,
    total_credits: totalCredits,
    currency: detectedCurrency,
    account_number: detectedAccount,
    date_range: dateRange,
  }
}

/**
 * Parse XLSX file and convert to CSV-like format
 */
async function parseXLSXFile(file: File): Promise<string> {
  // Dynamic import to avoid SSR issues
  const XLSX = await import('xlsx').catch(() => {
    throw new Error('XLSX library not available. Please install: npm install xlsx')
  })
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to CSV
        const csv = XLSX.utils.sheet_to_csv(worksheet)
        resolve(csv)
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse XLSX file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Read CSV or XLSX file and parse it
 */
export async function parseBankStatementFile(file: File): Promise<BankStatementUpload> {
  const isXLSX = file.name.toLowerCase().endsWith('.xlsx') || 
                 file.name.toLowerCase().endsWith('.xls') ||
                 file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 file.type === 'application/vnd.ms-excel'
  
  if (isXLSX) {
    try {
      const csvContent = await parseXLSXFile(file)
      return parseBankStatementCSV(csvContent, file.name)
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to parse XLSX file')
    }
  } else {
    // CSV file
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const parsed = parseBankStatementCSV(content, file.name)
          resolve(parsed)
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Failed to parse CSV file'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsText(file, 'UTF-8')
    })
  }
}

