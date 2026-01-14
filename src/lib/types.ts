export interface User {
  id: number
  full_name: string
  email: string
  role: string
  created_at?: string
  updated_at?: string
}

export interface Organization {
  id: number
  created_by: number
  business_type: string
  company_name: string
  address_line: string | null
  postal_code: string | null
  city: string | null
  country: string
  email: string | null
  attention_person: string | null
  vat_number: string | null
  currency: string
  status: string
  subscription_plan: string
  data_processing_agreement: boolean
  // Optional logo filename or path stored in the database
  logo?: string | null
  created_at: string
  updated_at: string
}

// Invoice Types
export interface Contact {
  id: number;
  organization_id: number;
  contact_type: 'company' | 'individual';
  name: string;
  email?: string;
  phone?: string;
  address_line?: string;
  postal_code?: string;
  city?: string;
  country: string;
  vat_number?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number; // percentage
  line_total?: number; // calculated field
  isHeadline?: boolean; // for display purposes
}

export interface Invoice {
  id: number;
  organization_id: number;
  contact_id?: number;
  created_by?: number;
  invoice_number: number;
  issue_date: string;
  due_date?: string;
  payment_terms: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  comments?: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total_amount: number;
  currency: string;
  bank_reg_no?: string;
  bank_account_no?: string;
  interest_rate: number;
  late_fee: number;
  created_at: string;
  updated_at: string;
  is_published?: boolean;
  payment_link?: string | null;
  // Relations
  contact?: Contact;
  items?: InvoiceItem[];
}

export interface CreateInvoiceInput {
  organization_id: number;
  contact_id?: number;
  invoice_number?: number;
  issue_date: string;
  due_date?: string;
  payment_terms?: string;
  comments?: string;
  currency?: string;
  bank_reg_no?: string;
  bank_account_no?: string;
  interest_rate?: number;
  late_fee?: number;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'line_total'>[];
}

export interface CreateContactInput {
  organization_id: number;
  contact_type: 'company' | 'individual';
  name: string;
  email?: string;
  phone?: string;
  address_line?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  vat_number?: string;
}

export interface UpdateContactInput {
  id: number;
  contact_type?: 'company' | 'individual';
  name?: string;
  email?: string;
  phone?: string;
  address_line?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  vat_number?: string;
}

// Bank Transaction Types
export interface BankTransaction {
  id?: number;
  organization_id?: number;
  transaction_date: string;
  value_date?: string;
  description: string;
  amount: number; // Positive for credit, negative for debit
  balance?: number;
  reference?: string;
  counterparty?: string;
  account_number?: string;
  currency?: string;
  transaction_type?: 'debit' | 'credit';
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ParsedBankTransaction {
  transaction_date: string;
  value_date?: string;
  description: string;
  amount: number;
  balance?: number;
  reference?: string;
  counterparty?: string;
  account_number?: string;
  currency?: string;
  transaction_type?: 'debit' | 'credit';
  errors?: string[];
  warnings?: string[];
}

export interface BankStatementUpload {
  filename: string;
  uploaded_at: string;
  transactions: ParsedBankTransaction[];
  total_debits: number;
  total_credits: number;
  currency: string;
  account_number?: string;
  date_range: {
    start: string;
    end: string;
  };
}

export interface PurchaseLine {
  id?: number;
  purchase_id?: number;
  line_no: number;
  description: string;
  amount_incl_vat: number;
  vat_amount: number;
  account_code?: string | null;
  inventory_category?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Purchase {
  id: number;
  organization_id: number;
  supplier_name: string;
  payment_type: "cash" | "credit";
  attachment_date: string;
  inventory_category?: string | null;
  amount_incl_vat: number;
  vat_amount: number;
  subtotal: number;
  total_amount: number;
  account_code?: string | null;
  description?: string | null;
  status: "draft" | "approved";
  attachment_url?: string | null;
  attachment_name?: string | null;
  created_at: string;
  updated_at: string;
  lines?: PurchaseLine[];
}

export interface CreatePurchaseInput {
  organization_id: number;
  supplier_name: string;
  payment_type: "cash" | "credit";
  attachment_date: string;
  inventory_category?: string | null;
  amount_incl_vat: number;
  vat_amount: number;
  subtotal?: number;
  total_amount?: number;
  account_code?: string | null;
  description?: string | null;
  status?: "draft" | "approved";
  lines?: Omit<PurchaseLine, "id" | "purchase_id" | "created_at" | "updated_at">[];
  attachment_file?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
}

export type ProductAccountCode =
  | "1000"
  | "1010"
  | "1100"
  | "1110"
  | "1120"
  | "1130"
  | "1200"
  | "1210"
  | "1220"
  | "1230"
  | "9000"
  | "9010";

export interface Product {
  id: number;
  organization_id: number;
  name: string;
  product_code: string | null;
  quantity: number;
  unit: string | null;
  price_excl_vat: number;
  account_code: ProductAccountCode;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  organization_id: number;
  name: string;
  product_code?: string | null;
  quantity?: number;
  unit?: string | null;
  price_excl_vat: number;
  account_code: ProductAccountCode;
  comment?: string | null;
}
