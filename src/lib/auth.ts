import bcrypt from 'bcrypt'

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 
  return await bcrypt.hash(password, saltRounds)
}


export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}


export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' }
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' }
  }
  
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  
  if (!hasLetter) {
    return { isValid: false, message: 'Password must contain at least one letter' }
  }
  
  if (!hasNumber) {
    return { isValid: false, message: 'Password must contain at least one number' }
  }
  
  return { isValid: true, message: 'Password is valid' }
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Check if OTP has expired
 * @param expiryDate OTP expiry date as string or Date
 * @returns true if expired, false if still valid
 */
export function isOTPExpired(expiryDate: string | Date): boolean {
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate
  return expiry < new Date()
}

/**
 * Get OTP expiry date (default: 10 minutes from now)
 * @param minutes Number of minutes until expiry (default: 10)
 * @returns Date object for expiry
 */
export function getOTPExpiry(minutes: number = 10): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + minutes)
  return expiry
}