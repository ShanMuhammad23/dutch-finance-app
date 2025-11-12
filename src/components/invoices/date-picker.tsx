"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DatePickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function DatePicker({ label, value, onChange, required }: DatePickerProps) {
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return ""
    }
    return date.toISOString().split("T")[0]
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={label.toLowerCase().replace(/\s+/g, '-')}
        type="date"
        value={formatDateForInput(value)}
        onChange={handleChange}
        required={required}
        className="w-full"
      />
    </div>
  )
}
