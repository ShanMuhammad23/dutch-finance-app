"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Contact } from "@/lib/types"

interface ContactInfoDisplayProps {
  contact: Contact
}

export function ContactInfoDisplay({ contact }: ContactInfoDisplayProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{contact.name}</h3>
            {contact.address_line && (
              <p className="text-sm text-muted-foreground">
                {contact.address_line}
                {contact.postal_code && contact.city && 
                  `, ${contact.postal_code} ${contact.city}`
                }
              </p>
            )}
            {contact.vat_number && (
              <p className="text-sm text-muted-foreground">
                CVR-nr. {contact.vat_number}
              </p>
            )}
            {contact.phone && (
              <p className="text-sm text-muted-foreground">
                Tel. {contact.phone}
              </p>
            )}
            {contact.email && (
              <p className="text-sm text-muted-foreground">
                Mail: {contact.email}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
