import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const sql = postgres(process.env.DATABASE_URL, { 
  ssl: 'require' 
})

export async function query<T = any>(queryText: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  try {
    if (!params || params.length === 0) {
      const result = await sql.unsafe(queryText) as T[]
      return {
        rows: Array.isArray(result) ? result : [],
        rowCount: Array.isArray(result) ? result.length : 0
      }
    }
    
    // Replace $1, $2 with escaped values and use sql.unsafe
    let safeQuery = queryText
    for (let i = params.length - 1; i >= 0; i--) {
      const value = params[i]
      let escapedValue: string
      
      if (value === null || value === undefined) {
        escapedValue = 'NULL'
      } else if (typeof value === 'string') {
        // Escape single quotes for SQL
        escapedValue = `'${value.replace(/'/g, "''")}'`
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        escapedValue = String(value)
      } else {
        escapedValue = `'${JSON.stringify(value).replace(/'/g, "''")}'`
      }
      
      safeQuery = safeQuery.replace(new RegExp(`\\$${i + 1}\\b`, 'g'), escapedValue)
    }
    
    const result = await sql.unsafe(safeQuery) as T[]
    return {
      rows: Array.isArray(result) ? result : [],
      rowCount: Array.isArray(result) ? result.length : 0
    }
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function queryOne<T = any>(queryText: string, params?: any[]): Promise<T | null> {
  const result = await query<T>(queryText, params)
  return result.rows[0] || null
}

export async function queryMany<T = any>(queryText: string, params?: any[]): Promise<T[]> {
  const result = await query<T>(queryText, params)
  return result.rows
}

export async function closeConnection(): Promise<void> {
  await sql.end()
}

// Export sql for direct use if needed
export { sql }

