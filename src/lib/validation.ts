import { z } from 'zod';

// Sanitize string inputs to prevent XSS
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Validate and sanitize HTML content
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
};

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Email invalide')
  .max(255, 'Email trop long')
  .transform(sanitizeString);

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe est trop long')
  .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
  .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
  .regex(/[0-9]/, 'Doit contenir au moins un chiffre');

export const nameSchema = z
  .string()
  .min(1, 'Le nom est requis')
  .max(100, 'Le nom est trop long')
  .transform(sanitizeString);

export const descriptionSchema = z
  .string()
  .min(10, 'La description doit contenir au moins 10 caractères')
  .max(5000, 'La description est trop longue')
  .transform(sanitizeString);

export const urlSchema = z
  .string()
  .url('URL invalide')
  .max(2000, 'URL trop longue')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Seuls les protocoles HTTP et HTTPS sont autorisés');

export const amountSchema = z
  .number()
  .min(0.5, 'Montant minimum: 0.50€')
  .max(999999, 'Montant maximum: 999,999€')
  .refine((val) => Number.isFinite(val), 'Montant invalide')
  .refine((val) => val >= 0, 'Le montant ne peut pas être négatif');

export const uuidSchema = z
  .string()
  .uuid('Identifiant invalide');

// Rate limiting helper (client-side)
export class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();

  constructor(private maxRequests: number, private windowMs: number) {}

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create timestamp array for this key
    const timestamps = this.timestamps.get(key) || [];

    // Filter out old timestamps
    const recentTimestamps = timestamps.filter((ts) => ts > windowStart);

    if (recentTimestamps.length >= this.maxRequests) {
      return false;
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.timestamps.set(key, recentTimestamps);

    return true;
  }

  reset(key: string): void {
    this.timestamps.delete(key);
  }
}

// File validation
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_DOCUMENT_SIZE_MB = 10;
