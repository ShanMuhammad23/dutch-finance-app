# API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Base URL](#base-url)
4. [API Endpoints](#api-endpoints)
   - [Authentication APIs](#authentication-apis)
   - [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
   - [Organizations](#organizations)
   - [Contacts](#contacts)
   - [Invoices](#invoices)
   - [Products](#products)
   - [Purchases](#purchases)
   - [Bank Transactions](#bank-transactions)
   - [Users](#users)
   - [Financial Metrics](#financial-metrics)
   - [Activity Logs](#activity-logs)
5. [Common Patterns](#common-patterns)
6. [Error Handling](#error-handling)
7. [Data Flow Diagrams](#data-flow-diagrams)

---

## Overview

This Next.js Admin Dashboard provides a comprehensive RESTful API for managing organizations, invoices, contacts, products, purchases, bank transactions, and user accounts. The API follows REST principles and uses JSON for request/response payloads.

### Key Features

- **Authentication**: NextAuth.js-based session management with JWT tokens
- **Two-Factor Authentication**: Email-based OTP verification
- **Multi-tenant Support**: Organization-based data isolation
- **Activity Logging**: Comprehensive audit trail for all operations
- **Plan Limits**: Subscription-based feature restrictions
- **File Uploads**: Support for purchase attachments and invoice PDFs

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Email**: Resend API
- **File Storage**: Local filesystem (`public/attachments`)

---

## Authentication & Authorization

### Authentication Methods

The API uses **NextAuth.js** for session management. There are two authentication endpoints:

1. **Custom Login API** (`/api/auth/login`) - Direct login with email/password
2. **NextAuth Session** (`/api/auth/[...nextauth]`) - Full NextAuth.js session management

### Session Management

- Sessions are managed via JWT tokens stored in HTTP-only cookies
- Session data includes: `user.id`, `user.email`, `user.name`, `user.role`
- Roles: `owner`, `admin`, `accountant`, `bookkeeper`

### Authorization Levels

- **Owner/Admin**: Full access to all resources
- **Accountant/Bookkeeper**: Limited access (organization-scoped)

### Organization Scoping

Most endpoints require an `organizationId` parameter to ensure data isolation between organizations.

---

## Base URL

All API endpoints are prefixed with `/api`:

```
http://localhost:3000/api
```

For production, replace with your domain:
```
https://yourdomain.com/api
```

---

## API Endpoints

## Authentication APIs

### 1. Login

**Endpoint**: `POST /api/auth/login`

**Description**: Authenticates a user with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "user@example.com",
    "role": "owner",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Internal server error

**Flow**:
1. Validates email and password presence
2. Queries user from database
3. Compares password (supports both bcrypt hashed and plain text for legacy)
4. Returns user data (password excluded)

---

### 2. Signup

**Endpoint**: `POST /api/auth/signup`

**Description**: Creates a new user account.

**Request Body**:
```json
{
  "full_name": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Response** (201 Created):
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "user@example.com",
    "role": "owner",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Missing required fields or weak password
- `409`: User with email already exists
- `500`: Internal server error

**Flow**:
1. Validates required fields
2. Validates password strength
3. Checks for existing user
4. Hashes password with bcrypt
5. Creates user with role 'owner'
6. Logs signup activity

---

### 3. NextAuth Session

**Endpoint**: `GET/POST /api/auth/[...nextauth]`

**Description**: NextAuth.js session management endpoint. Handles OAuth, credentials, and session management.

**Features**:
- Credentials-based authentication
- 2FA support with OTP
- Automatic OTP generation and email sending
- Session refresh
- JWT token management

**Flow with 2FA**:
1. User provides email and password
2. If 2FA enabled, OTP is automatically generated and sent via email
3. User must provide OTP in subsequent request
4. OTP is validated and cleared after use
5. Session is created upon successful authentication

---

## Two-Factor Authentication (2FA)

### 1. Send OTP

**Endpoint**: `POST /api/auth/2fa/send-otp`

**Description**: Generates and sends an OTP code to the user's email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "OTP sent successfully to your email",
  "expiresIn": 600
}
```

**Error Responses**:
- `400`: Email required or 2FA not enabled
- `404`: User not found
- `500`: Failed to send OTP

**Flow**:
1. Validates email
2. Checks if user exists
3. Verifies 2FA is enabled
4. Generates 6-digit OTP
5. Stores OTP with 10-minute expiry
6. Sends HTML email with OTP
7. Returns success response

---

### 2. Verify OTP

**Endpoint**: `POST /api/auth/2fa/verify-otp`

**Description**: Verifies the OTP code provided by the user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response** (200 OK):
```json
{
  "message": "OTP verified successfully",
  "verified": true
}
```

**Error Responses**:
- `400`: Missing email/OTP, 2FA not enabled, no OTP found, or OTP expired
- `401`: Invalid OTP
- `404`: User not found
- `500`: Internal server error

**Flow**:
1. Validates email and OTP
2. Checks if user exists
3. Verifies 2FA is enabled
4. Checks if OTP exists in database
5. Validates OTP hasn't expired (10 minutes)
6. Compares OTP values
7. Clears OTP from database
8. Returns verification result

---

### 3. Get 2FA Status

**Endpoint**: `GET /api/auth/2fa/status`

**Description**: Retrieves the 2FA status for the current user.

**Authentication**: Required (session)

**Response** (200 OK):
```json
{
  "is_twofactor": true
}
```

**Error Responses**:
- `401`: Unauthorized
- `404`: User not found
- `500`: Internal server error

---

### 4. Toggle 2FA

**Endpoint**: `POST /api/auth/2fa/toggle`

**Description**: Enables or disables 2FA for the current user.

**Authentication**: Required (session)

**Request Body**:
```json
{
  "istwofactor": true
}
```

**Response** (200 OK):
```json
{
  "message": "Two-factor authentication enabled",
  "is_twofactor": true
}
```

**Error Responses**:
- `400`: Invalid boolean value
- `401`: Unauthorized
- `500`: Internal server error

**Flow**:
1. Validates session
2. Updates 2FA setting
3. If disabling, clears OTP and expiry
4. Logs activity
5. Returns updated status

---

## Organizations

### 1. List Organizations

**Endpoint**: `GET /api/organizations?userId={userId}`

**Description**: Retrieves all organizations created by a specific user.

**Query Parameters**:
- `userId` (required): User ID

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "company_name": "Acme Corp",
    "business_type": "LLC",
    "vat_number": "12345678",
    "email": "contact@acme.com",
    "address_line": "123 Main St",
    "postal_code": "12345",
    "city": "Copenhagen",
    "country": "Denmark",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses**:
- `400`: User ID required
- `500`: Internal server error

**Flow**:
1. Validates userId parameter
2. Queries organizations filtered by created_by
3. Logs activity
4. Returns organization list

---

### 2. Get Organization

**Endpoint**: `GET /api/organizations/{id}?userId={userId}`

**Description**: Retrieves a single organization by ID.

**Path Parameters**:
- `id`: Organization ID

**Query Parameters**:
- `userId` (required): User ID (for authorization)

**Response** (200 OK):
```json
{
  "id": 1,
  "company_name": "Acme Corp",
  "business_type": "LLC",
  ...
}
```

**Error Responses**:
- `400`: User ID required
- `404`: Organization not found
- `500`: Internal server error

---

### 3. Create Organization

**Endpoint**: `POST /api/organizations`

**Description**: Creates a new organization.

**Request Body**:
```json
{
  "userId": 1,
  "company_name": "Acme Corp",
  "business_type": "LLC",
  "vat_number": "12345678",
  "email": "contact@acme.com",
  "address_line": "123 Main St",
  "postal_code": "12345",
  "city": "Copenhagen",
  "country": "Denmark"
}
```

**Required Fields**:
- `userId`
- `business_type`
- `company_name`

**Response** (201 Created):
```json
{
  "id": 1,
  "company_name": "Acme Corp",
  ...
}
```

**Error Responses**:
- `400`: Missing required fields
- `500`: Failed to create organization

**Flow**:
1. Validates required fields
2. Builds dynamic INSERT query
3. Creates organization
4. Logs activity
5. Returns created organization

---

### 4. Update Organization

**Endpoint**: `PUT /api/organizations/{id}`

**Description**: Updates an existing organization.

**Path Parameters**:
- `id`: Organization ID

**Request Body**:
```json
{
  "userId": 1,
  "company_name": "Updated Corp",
  "email": "newemail@acme.com"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "company_name": "Updated Corp",
  ...
}
```

**Error Responses**:
- `400`: User ID required
- `404`: Organization not found
- `500`: Internal server error

**Flow**:
1. Validates userId
2. Builds dynamic UPDATE query from provided fields
3. Updates organization
4. Logs activity
5. Returns updated organization

---

### 5. Delete Organization

**Endpoint**: `DELETE /api/organizations/{id}?userId={userId}`

**Description**: Deletes an organization.

**Path Parameters**:
- `id`: Organization ID

**Query Parameters**:
- `userId` (required): User ID

**Response** (200 OK):
```json
{
  "success": true
}
```

**Error Responses**:
- `400`: User ID required
- `404`: Organization not found
- `500`: Internal server error

---

### 6. Get Organization Limits

**Endpoint**: `GET /api/organizations/{id}/limits`

**Description**: Retrieves current usage and limits for an organization based on subscription plan.

**Path Parameters**:
- `id`: Organization ID

**Response** (200 OK):
```json
{
  "plan": "free",
  "limits": {
    "users": {
      "current": 2,
      "limit": 1,
      "allowed": false
    },
    "invoices": {
      "current": 5,
      "limit": 10,
      "allowed": true
    }
  },
  "features": {
    "invoices": true,
    "contacts": true,
    "products": true
  },
  "support": "community"
}
```

**Error Responses**:
- `400`: Invalid organization ID
- `404`: Organization not found
- `500`: Internal server error

**Flow**:
1. Validates organization ID
2. Fetches organization and subscription plan
3. Gets plan limits configuration
4. Calculates current usage (invoices this month, user count)
5. Checks limits
6. Returns usage and limits data

---

## Contacts

### 1. List Contacts

**Endpoint**: `GET /api/contacts?organizationId={organizationId}`

**Description**: Retrieves all contacts for an organization.

**Query Parameters**:
- `organizationId` (required): Organization ID

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "organization_id": 1,
    "contact_type": "customer",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+4512345678",
    "address_line": "123 Street",
    "postal_code": "12345",
    "city": "Copenhagen",
    "country": "Denmark",
    "vat_number": "12345678",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses**:
- `400`: Organization ID required
- `500`: Internal server error

---

### 2. Get Contact

**Endpoint**: `GET /api/contacts/{id}?organizationId={organizationId}`

**Description**: Retrieves a single contact by ID.

**Path Parameters**:
- `id`: Contact ID

**Query Parameters**:
- `organizationId` (required): Organization ID

**Response** (200 OK):
```json
{
  "id": 1,
  "organization_id": 1,
  "name": "John Doe",
  ...
}
```

**Error Responses**:
- `400`: Invalid contact ID or organization ID required
- `404`: Contact not found
- `500`: Internal server error

---

### 3. Create Contact

**Endpoint**: `POST /api/contacts`

**Description**: Creates a new contact.

**Request Body**:
```json
{
  "organization_id": 1,
  "contact_type": "customer",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+4512345678",
  "address_line": "123 Street",
  "postal_code": "12345",
  "city": "Copenhagen",
  "country": "Denmark",
  "vat_number": "12345678"
}
```

**Required Fields**:
- `organization_id`
- `name`

**Response** (201 Created):
```json
{
  "id": 1,
  "organization_id": 1,
  "name": "John Doe",
  ...
}
```

**Error Responses**:
- `400`: Missing required fields
- `500`: Failed to create contact

---

### 4. Update Contact

**Endpoint**: `PUT /api/contacts/{id}?organizationId={organizationId}`

**Description**: Updates an existing contact.

**Path Parameters**:
- `id`: Contact ID

**Query Parameters**:
- `organizationId` (required): Organization ID

**Request Body**:
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Updated Name",
  ...
}
```

**Error Responses**:
- `400`: Invalid contact ID or organization ID required
- `404`: Contact not found
- `500`: Internal server error

---

### 5. Delete Contact

**Endpoint**: `DELETE /api/contacts/{id}?organizationId={organizationId}`

**Description**: Deletes a contact.

**Path Parameters**:
- `id`: Contact ID

**Query Parameters**:
- `organizationId` (required): Organization ID

**Response** (200 OK):
```json
{
  "success": true
}
```

**Error Responses**:
- `400`: Invalid contact ID or organization ID required
- `404`: Contact not found
- `500`: Internal server error

---

## Invoices

### 1. List Invoices

**Endpoint**: `GET /api/invoices?organizationId={organizationId}`

**Description**: Retrieves all invoices for an organization with contact and items data.

**Query Parameters**:
- `organizationId` (required): Organization ID

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "organization_id": 1,
    "contact_id": 1,
    "invoice_number": 1001,
    "issue_date": "2024-01-01",
    "due_date": "2024-01-08",
    "status": "sent",
    "subtotal": 1000.00,
    "discount_total": 0.00,
    "tax_total": 250.00,
    "total_amount": 1250.00,
    "currency": "DKK",
    "contact": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      ...
    },
    "items": [
      {
        "id": 1,
        "description": "Product A",
        "quantity": 2,
        "unit": "pcs",
        "unit_price": 500.00,
        "discount": 0,
        "line_total": 1000.00
      }
    ],
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses**:
- `400`: Organization ID required or invalid
- `500`: Internal server error

**Flow**:
1. Validates organization ID
2. Queries invoices with JOINs to contacts and invoice_items
3. Groups invoice items using JSON aggregation
4. Parses JSON fields if needed
5. Logs activity
6. Returns invoice list

---

### 2. Get Invoice

**Endpoint**: `GET /api/invoices/{id}`

**Description**: Retrieves a single invoice with full details including contact, items, and organization.

**Path Parameters**:
- `id`: Invoice ID

**Response** (200 OK):
```json
{
  "id": 1,
  "organization_id": 1,
  "contact_id": 1,
  "invoice_number": 1001,
  "issue_date": "2024-01-01",
  "due_date": "2024-01-08",
  "status": "sent",
  "total_amount": 1250.00,
  "contact": { ... },
  "items": [ ... ],
  "organization": {
    "id": 1,
    "company_name": "Acme Corp",
    ...
  }
}
```

**Error Responses**:
- `400`: Invalid invoice ID
- `404`: Invoice not found
- `500`: Internal server error

---

### 3. Create Invoice

**Endpoint**: `POST /api/invoices`

**Description**: Creates a new invoice with items.

**Request Body**:
```json
{
  "organization_id": 1,
  "contact_id": 1,
  "invoice_number": 1001,
  "issue_date": "2024-01-01",
  "due_date": "2024-01-08",
  "payment_terms": "Net 8 days",
  "status": "draft",
  "currency": "DKK",
  "comments": "Thank you for your business",
  "bank_reg_no": "1234",
  "bank_account_no": "567890",
  "interest_rate": 0.81,
  "late_fee": 100,
  "items": [
    {
      "description": "Product A",
      "quantity": 2,
      "unit": "pcs",
      "unit_price": 500.00,
      "discount": 0
    }
  ]
}
```

**Required Fields**:
- `organization_id`
- `issue_date`
- `items` (array with at least one item)

**Response** (201 Created):
```json
{
  "id": 1,
  "invoice_number": 1001,
  "total_amount": 1250.00,
  "items": [ ... ],
  ...
}
```

**Error Responses**:
- `400`: Missing required fields
- `403`: Invoice limit exceeded (plan limits)
- `500`: Failed to create invoice

**Flow**:
1. Validates required fields
2. Checks plan limits for invoice creation
3. Calculates invoice totals (subtotal, discount, tax, total)
4. Creates invoice record
5. Inserts invoice items
6. If status is 'sent' and contact has email, triggers email sending
7. Logs activity
8. Returns created invoice

**Plan Limits Check**:
- Free plan: 10 invoices/month
- Paid plans: Higher limits
- Returns 403 if limit exceeded

---

### 4. Update Invoice

**Endpoint**: `PUT /api/invoices/{id}`

**Description**: Updates an existing invoice.

**Path Parameters**:
- `id`: Invoice ID

**Request Body**:
```json
{
  "status": "sent",
  "comments": "Updated comments"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Invoice updated"
}
```

**Note**: Currently returns success message. Full implementation may vary.

---

### 5. Delete Invoice

**Endpoint**: `DELETE /api/invoices/{id}`

**Description**: Deletes an invoice.

**Path Parameters**:
- `id`: Invoice ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Invoice deleted"
}
```

---

### 6. Generate Invoice PDF

**Endpoint**: `GET /api/invoices/{id}/pdf`

**Description**: Generates an HTML representation of the invoice for PDF conversion.

**Path Parameters**:
- `id`: Invoice ID

**Response** (200 OK):
- Content-Type: `text/html`
- Returns HTML page with invoice details

**Flow**:
1. Fetches invoice with contact, items, and organization
2. Generates HTML with styled invoice layout
3. Includes company logo, billing details, line items, totals
4. Returns HTML that can be converted to PDF by browser

---

### 7. Send Invoice Email

**Endpoint**: `POST /api/invoices/{id}/send-email`

**Description**: Sends an invoice via email to the contact.

**Path Parameters**:
- `id`: Invoice ID

**Response** (200 OK):
```json
{
  "message": "Invoice sent successfully",
  "sentTo": "m.ikram9720@gmail.com"
}
```

**Flow**:
1. Fetches invoice with all details
2. Generates HTML email with invoice summary
3. Includes payment link and PDF link
4. Sends email via Resend API
5. Updates invoice status to 'sent' if currently 'draft'
6. Returns success response

**Email Features**:
- HTML and plain text versions
- Invoice summary table
- Payment link button
- PDF download link
- Bank account information

---

## Products

### 1. List Products

**Endpoint**: `GET /api/products?organizationId={organizationId}`

**Description**: Retrieves all products for an organization.

**Query Parameters**:
- `organizationId` (required): Organization ID

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "organization_id": 1,
    "name": "Product A",
    "product_code": "PROD-001",
    "quantity": 100,
    "unit": "stk.",
    "price_excl_vat": 500.00,
    "account_code": "1000",
    "comment": "Standard product",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Account Codes**:
- `1000`: Quota
- `1010`: Quota, Passive members
- `1100`: Activity allowance
- `1110`: Coaching allowance
- `1120`: Course and training grants
- `1130`: Other grants
- `1200`: Sponsorship income
- `1210`: Income from conventions, events, etc.
- `1220`: Other Income
- `1230`: Reminder fees
- `9000`: Interest income
- `9010`: Financial income, other

---

### 2. Get Product

**Endpoint**: `GET /api/products/{id}`

**Description**: Retrieves a single product by ID.

**Path Parameters**:
- `id`: Product ID

**Response** (200 OK):
```json
{
  "id": 1,
  "organization_id": 1,
  "name": "Product A",
  ...
}
```

---

### 3. Create Product

**Endpoint**: `POST /api/products`

**Description**: Creates a new product.

**Request Body**:
```json
{
  "organization_id": 1,
  "name": "Product A",
  "product_code": "PROD-001",
  "quantity": 100,
  "unit": "stk.",
  "price_excl_vat": 500.00,
  "account_code": "1000",
  "comment": "Standard product"
}
```

**Required Fields**:
- `organization_id`
- `name`
- `price_excl_vat`
- `account_code` (must be valid account code)

**Response** (201 Created):
```json
{
  "id": 1,
  "name": "Product A",
  ...
}
```

---

### 4. Update Product

**Endpoint**: `PUT /api/products/{id}`

**Description**: Updates an existing product.

**Path Parameters**:
- `id`: Product ID

**Request Body**:
```json
{
  "name": "Updated Product A",
  "price_excl_vat": 600.00
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Updated Product A",
  ...
}
```

---

### 5. Delete Product

**Endpoint**: `DELETE /api/products/{id}`

**Description**: Deletes a product.

**Path Parameters**:
- `id`: Product ID

**Response** (200 OK):
```json
{
  "success": true
}
```

---

## Purchases

### 1. List Purchases

**Endpoint**: `GET /api/purchases?organizationId={organizationId}`

**Description**: Retrieves all purchases for an organization with their line items.

**Query Parameters**:
- `organizationId` (required): Organization ID

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "organization_id": 1,
    "supplier_name": "Supplier Corp",
    "payment_type": "card",
    "attachment_date": "2024-01-01",
    "inventory_category": "Office Supplies",
    "account_code": "2000",
    "description": "Monthly supplies",
    "amount_incl_vat": 1000.00,
    "vat_amount": 250.00,
    "subtotal": 750.00,
    "total_amount": 1000.00,
    "status": "approved",
    "attachment_url": "/attachments/file.jpg",
    "attachment_name": "receipt.jpg",
    "lines": [
      {
        "id": 1,
        "purchase_id": 1,
        "line_no": 1,
        "description": "Item 1",
        "amount_incl_vat": 500.00,
        "vat_amount": 125.00,
        "account_code": "2000",
        "inventory_category": "Office Supplies"
      }
    ],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Create Purchase

**Endpoint**: `POST /api/purchases`

**Description**: Creates a new purchase with optional line items.

**Request Body**:
```json
{
  "organization_id": 1,
  "supplier_name": "Supplier Corp",
  "payment_type": "card",
  "attachment_date": "2024-01-01",
  "inventory_category": "Office Supplies",
  "account_code": "2000",
  "description": "Monthly supplies",
  "amount_incl_vat": 1000.00,
  "vat_amount": 250.00,
  "subtotal": 750.00,
  "total_amount": 1000.00,
  "status": "draft",
  "attachment_file": "/attachments/file.jpg",
  "attachment_name": "receipt.jpg",
  "lines": [
    {
      "line_no": 1,
      "description": "Item 1",
      "amount_incl_vat": 500.00,
      "vat_amount": 125.00,
      "account_code": "2000",
      "inventory_category": "Office Supplies"
    }
  ]
}
```

**Required Fields**:
- `organization_id`
- `supplier_name`
- `attachment_date`
- `payment_type`
- `amount_incl_vat`

**Response** (201 Created):
```json
{
  "id": 1,
  "supplier_name": "Supplier Corp",
  "lines": [ ... ],
  ...
}
```

---

### 3. Upload Purchase Attachment

**Endpoint**: `POST /api/purchases/upload`

**Description**: Uploads an image file for purchase attachments.

**Request**: `multipart/form-data`

**Form Data**:
- `file`: Image file (JPEG, PNG, GIF, WebP)

**File Restrictions**:
- Max size: 20 MB
- Allowed types: image/jpeg, image/jpg, image/png, image/gif, image/webp

**Response** (200 OK):
```json
{
  "success": true,
  "filePath": "/attachments/1234567890-abc123.jpg",
  "storedFileName": "1234567890-abc123.jpg",
  "originalFileName": "receipt.jpg"
}
```

**Flow**:
1. Validates file presence
2. Validates file type (images only)
3. Validates file size (20 MB max)
4. Generates unique filename with timestamp
5. Saves file to `public/attachments/`
6. Logs activity
7. Returns file path

---

## Bank Transactions

### 1. List Bank Transactions

**Endpoint**: `GET /api/bank-transactions?organizationId={organizationId}`

**Description**: Retrieves all bank transactions for an organization.

**Query Parameters**:
- `organizationId` (required): Organization ID

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "organization_id": 1,
    "transaction_date": "2024-01-01",
    "value_date": "2024-01-01",
    "description": "Payment from customer",
    "amount": 1000.00,
    "balance": 5000.00,
    "reference": "REF123",
    "counterparty": "Customer Corp",
    "account_number": "1234567890",
    "currency": "DKK",
    "transaction_type": "credit",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Import Bank Transactions

**Endpoint**: `POST /api/bank-transactions`

**Description**: Imports bank transactions from a file (CSV, etc.).

**Request Body**:
```json
{
  "organization_id": 1,
  "filename": "statement.csv",
  "transactions": [
    {
      "transaction_date": "2024-01-01",
      "value_date": "2024-01-01",
      "description": "Payment",
      "amount": 1000.00,
      "balance": 5000.00,
      "reference": "REF123",
      "counterparty": "Customer",
      "account_number": "1234567890",
      "currency": "DKK",
      "transaction_type": "credit"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "inserted": 10,
  "skipped": 2,
  "total": 12,
  "transactions": [ ... ],
  "skippedDuplicates": [ ... ],
  "errors": [ ... ]
}
```

**Duplicate Detection**:
- Checks by: date + amount + description
- Also checks reference number if available
- Also checks account number if available
- Skips duplicates automatically

**Flow**:
1. Validates organization ID and transactions array
2. Fetches existing transactions
3. For each transaction:
   - Validates required fields
   - Checks for duplicates
   - Inserts if unique
4. Logs activity
5. Returns import summary

---

### 3. Check Duplicates

**Endpoint**: `POST /api/bank-transactions/check-duplicates`

**Description**: Checks which transactions would be duplicates before importing.

**Request Body**:
```json
{
  "organization_id": 1,
  "transactions": [ ... ]
}
```

**Response** (200 OK):
```json
{
  "total": 12,
  "duplicates": 2,
  "unique": 10,
  "results": [
    {
      "index": 0,
      "transaction": { ... },
      "isDuplicate": false,
      "matchReason": null
    },
    {
      "index": 1,
      "transaction": { ... },
      "isDuplicate": true,
      "matchReason": "date_amount_description"
    }
  ]
}
```

---

### 4. Get Import History

**Endpoint**: `GET /api/bank-transactions/import-history?organizationId={organizationId}`

**Description**: Retrieves import history grouped by upload sessions.

**Query Parameters**:
- `organizationId` (required): Organization ID

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "filename": "Bank Statement - 1234567890 (01/01/2024)",
    "uploaded_at": "2024-01-01T00:00:00.000Z",
    "transaction_count": 50,
    "total_credits": 10000.00,
    "total_debits": 5000.00,
    "currency": "DKK",
    "date_range_start": "2024-01-01",
    "date_range_end": "2024-01-31"
  }
]
```

---

## Users

### 1. List Users

**Endpoint**: `GET /api/users`

**Description**: Retrieves all users (admin/owner only).

**Authentication**: Required (owner/admin role)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "owner",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses**:
- `401`: Unauthorized
- `403`: Insufficient permissions
- `500`: Internal server error

---

### 2. Create User

**Endpoint**: `POST /api/users`

**Description**: Creates a new user (admin/owner only).

**Authentication**: Required (owner/admin role)

**Request Body**:
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role": "accountant"
}
```

**Valid Roles**:
- `owner`
- `admin`
- `accountant`
- `bookkeeper`

**Response** (201 Created):
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "role": "accountant",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Missing required fields, invalid role, or weak password
- `401`: Unauthorized
- `403`: Insufficient permissions
- `409`: User with email already exists
- `500`: Internal server error

---

### 3. Update User

**Endpoint**: `PATCH /api/users/{id}`

**Description**: Updates a user (admin/owner only).

**Authentication**: Required (owner/admin role)

**Path Parameters**:
- `id`: User ID

**Request Body**:
```json
{
  "full_name": "Updated Name",
  "email": "newemail@example.com",
  "role": "admin"
}
```

**Response** (200 OK):
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 2,
    "full_name": "Updated Name",
    ...
  }
}
```

---

### 4. Delete User

**Endpoint**: `DELETE /api/users/{id}`

**Description**: Deletes a user (admin/owner only).

**Authentication**: Required (owner/admin role)

**Path Parameters**:
- `id`: User ID

**Response** (200 OK):
```json
{
  "message": "User deleted successfully"
}
```

---

## Financial Metrics

### 1. Get Financial Metrics

**Endpoint**: `GET /api/financial-metrics?organizationId={organizationId}&period={period}&startDate={startDate}&endDate={endDate}`

**Description**: Retrieves financial metrics including income, expenses, and profit.

**Query Parameters**:
- `organizationId` (required): Organization ID
- `period` (optional): `month`, `year`, or `all` (default: `all`)
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response** (200 OK):
```json
{
  "summary": {
    "income": 50000.00,
    "expenses": 30000.00,
    "profit": 20000.00,
    "incomeGrowth": 10.5,
    "expensesGrowth": 5.2,
    "profitGrowth": 15.8
  },
  "timeSeries": [
    {
      "month": "2024-01-01T00:00:00.000Z",
      "income": 10000.00,
      "expenses": 5000.00,
      "profit": 5000.00
    }
  ],
  "period": "month"
}
```

**Data Sources**:
- **Income**: Paid invoices + positive bank transactions
- **Expenses**: Negative bank transactions + purchases
- **Profit**: Income - Expenses

**Flow**:
1. Validates organization ID
2. Calculates date filters based on period
3. Queries invoices (paid status) for income
4. Queries bank transactions (positive = income, negative = expenses)
5. Queries purchases for expenses
6. Calculates monthly time series data
7. Merges data from all sources
8. Calculates growth rates (if period = month)
9. Returns summary and time series

---

## Activity Logs

### 1. List Activity Logs

**Endpoint**: `GET /api/activity-logs?organizationId={organizationId}&entityType={entityType}&action={action}&limit={limit}&offset={offset}`

**Description**: Retrieves activity logs with filtering (admin/owner only).

**Authentication**: Required (owner/admin role)

**Query Parameters**:
- `organizationId` (optional): Filter by organization
- `entityType` (optional): Filter by entity type (e.g., `invoice`, `contact`, `user`)
- `action` (optional): Filter by action (e.g., `CREATE`, `UPDATE`, `DELETE`, `VIEW`)
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "logs": [
    {
      "id": 1,
      "action": "CREATE",
      "entity_type": "invoice",
      "entity_id": 1,
      "organization_id": 1,
      "user_id": 1,
      "description": "Created invoice #1001",
      "details": {
        "invoice_id": 1,
        "invoice_number": 1001,
        "total_amount": 1250.00
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T00:00:00.000Z",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "organization_name": "Acme Corp"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

**Actions**:
- `CREATE`: Entity created
- `UPDATE`: Entity updated
- `DELETE`: Entity deleted
- `VIEW`: Entity viewed
- `LOGIN`: User logged in
- `IMPORT`: Data imported

**Entity Types**:
- `user`
- `organization`
- `contact`
- `invoice`
- `product`
- `purchase`
- `auth`

---

## Common Patterns

### 1. Organization Scoping

Most endpoints require an `organizationId` parameter to ensure data isolation:

```javascript
// Example: Getting contacts
GET /api/contacts?organizationId=1
```

### 2. Dynamic Updates

Update endpoints use dynamic SQL building to update only provided fields:

```javascript
// Example: Partial update
PUT /api/contacts/1?organizationId=1
{
  "name": "Updated Name"
  // Only name is updated, other fields remain unchanged
}
```

### 3. Activity Logging

All CREATE, UPDATE, DELETE, and VIEW operations are automatically logged:

- User ID from session
- IP address and user agent from request
- Entity details in JSON format
- Timestamp

### 4. Plan Limits

Invoice creation checks subscription plan limits:

```javascript
// Free plan: 10 invoices/month
// Returns 403 if limit exceeded
{
  "error": "Invoice limit exceeded for free plan",
  "limitExceeded": true,
  "limitType": "invoices",
  "current": 10,
  "limit": 10
}
```

### 5. JSON Aggregation

Complex queries use PostgreSQL JSON functions to aggregate related data:

```sql
-- Example: Invoices with items
json_agg(json_build_object(...)) as items
```

### 6. Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message here"
}
```

With appropriate HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions or limits exceeded)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

---

## Error Handling

### Standard Error Response

All errors return JSON with an `error` field:

```json
{
  "error": "Error message"
}
```

### HTTP Status Codes

- **200 OK**: Successful GET, PUT, PATCH, DELETE
- **201 Created**: Successful POST (resource created)
- **400 Bad Request**: Invalid input, missing required fields
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Insufficient permissions or plan limits exceeded
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource (e.g., email already exists)
- **500 Internal Server Error**: Server-side error

### Validation Errors

Validation errors return `400` with specific messages:

```json
{
  "error": "Organization ID and name are required"
}
```

### Authentication Errors

Authentication errors return `401`:

```json
{
  "error": "Unauthorized"
}
```

### Permission Errors

Permission errors return `403`:

```json
{
  "error": "Forbidden - Insufficient permissions"
}
```

### Plan Limit Errors

Plan limit errors return `403` with additional details:

```json
{
  "error": "Invoice limit exceeded for free plan. Upgrade to create more invoices.",
  "limitExceeded": true,
  "limitType": "invoices",
  "current": 10,
  "limit": 10
}
```

---

## Data Flow Diagrams

### Authentication Flow

```
1. User submits login form
   ↓
2. POST /api/auth/login
   ↓
3. Validate email/password
   ↓
4. If 2FA enabled:
   - Generate OTP
   - Store in database
   - Send email
   - Return OTP_REQUIRED error
   ↓
5. User submits OTP
   ↓
6. POST /api/auth/[...nextauth] with OTP
   ↓
7. Verify OTP
   ↓
8. Create session (JWT)
   ↓
9. Return session cookie
```

### Invoice Creation Flow

```
1. POST /api/invoices
   ↓
2. Validate required fields
   ↓
3. Check plan limits
   ↓
4. Calculate totals (subtotal, discount, tax, total)
   ↓
5. Insert invoice record
   ↓
6. Insert invoice items
   ↓
7. If status = 'sent' and contact has email:
   - Trigger email sending (async)
   ↓
8. Log activity
   ↓
9. Return created invoice
```

### Bank Transaction Import Flow

```
1. POST /api/bank-transactions
   ↓
2. Validate organization ID and transactions array
   ↓
3. Fetch existing transactions
   ↓
4. For each transaction:
   - Validate required fields
   - Check for duplicates
   - If unique: Insert
   - If duplicate: Skip
   ↓
5. Log import activity
   ↓
6. Return summary (inserted, skipped, errors)
```

### Activity Logging Flow

```
1. API endpoint receives request
   ↓
2. Authenticate user (get session)
   ↓
3. Perform operation (CREATE/UPDATE/DELETE/VIEW)
   ↓
4. Extract request metadata:
   - IP address
   - User agent
   - User ID from session
   ↓
5. Log activity to activity_logs table
   ↓
6. Return response
```

---

## Additional Notes

### File Storage

- Purchase attachments: Stored in `public/attachments/`
- Filenames: `{timestamp}-{random}.{extension}`
- Max file size: 20 MB
- Allowed types: Images only (JPEG, PNG, GIF, WebP)

### Email Configuration

- Email service: Resend API
- From address: `delivered@resend.dev` (verified domain)
- Reply-to: Organization email (if available)
- Templates: HTML and plain text versions

### Database

- PostgreSQL database
- Connection: Via `DATABASE_URL` environment variable
- SSL: Required for production

### Security

- Passwords: Hashed with bcrypt
- Sessions: JWT tokens in HTTP-only cookies
- 2FA: Email-based OTP (10-minute expiry)
- Organization isolation: All queries filtered by organization_id

### Performance

- JSON aggregation for related data
- Efficient duplicate detection
- Pagination for large datasets
- Indexed queries on organization_id

---

## Support

For API support or questions, please contact the development team.

**Last Updated**: January 2024

