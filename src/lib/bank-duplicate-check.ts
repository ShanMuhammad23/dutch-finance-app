/**
 * Duplicate Transaction Detection
 * Checks if transactions already exist in the database
 */

import { ParsedBankTransaction } from './types'

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingTransactionId?: number
  matchReason?: string
}

/**
 * Generate a unique fingerprint for a transaction
 * Used to identify duplicates
 */
export function generateTransactionFingerprint(transaction: ParsedBankTransaction): string {
  // Normalize description (remove extra spaces, lowercase)
  const normalizedDescription = transaction.description
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
  
  // Create fingerprint from key fields
  const parts = [
    transaction.transaction_date,
    transaction.amount.toFixed(2),
    normalizedDescription,
    transaction.reference || '',
    transaction.account_number || '',
  ]
  
  return parts.join('|')
}

/**
 * Check if a transaction is a duplicate based on multiple criteria
 */
export function isDuplicateTransaction(
  transaction: ParsedBankTransaction,
  existingTransactions: Array<{
    transaction_date: string
    amount: number
    description: string
    reference?: string | null
    account_number?: string | null
  }>
): DuplicateCheckResult {
  for (const existing of existingTransactions) {
    // Check exact match: date + amount + description
    if (
      existing.transaction_date === transaction.transaction_date &&
      Math.abs(existing.amount - transaction.amount) < 0.01 && // Allow small floating point differences
      existing.description.toLowerCase().trim() === transaction.description.toLowerCase().trim()
    ) {
      // If reference exists, also check it
      if (transaction.reference && existing.reference) {
        if (existing.reference === transaction.reference) {
          return {
            isDuplicate: true,
            matchReason: 'Exact match: date, amount, description, and reference',
          }
        }
      } else {
        // Check account number if available
        if (transaction.account_number && existing.account_number) {
          if (existing.account_number === transaction.account_number) {
            return {
              isDuplicate: true,
              matchReason: 'Exact match: date, amount, description, and account',
            }
          }
        } else {
          // Match without reference/account - might be duplicate
          return {
            isDuplicate: true,
            matchReason: 'Possible duplicate: date, amount, and description match',
          }
        }
      }
    }
    
    // Check by reference number if available (strong indicator)
    if (transaction.reference && existing.reference) {
      if (
        existing.reference === transaction.reference &&
        existing.transaction_date === transaction.transaction_date &&
        Math.abs(existing.amount - transaction.amount) < 0.01
      ) {
        return {
          isDuplicate: true,
          matchReason: 'Duplicate reference number with matching date and amount',
        }
      }
    }
  }
  
  return { isDuplicate: false }
}

