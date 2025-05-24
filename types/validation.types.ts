// types/validation.types.ts

export interface ValidationRule {
  required?: boolean
  type?: "string" | "number" | "boolean" | "array" | "object"
  validator?: (value: unknown) => boolean
  message?: string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  data?: unknown
}