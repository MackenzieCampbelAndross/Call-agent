import { CallRecord } from './types';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * Sanitize a phone number by stripping spaces, hyphens, and parenthesis.
 */
export declare function sanitizePhoneNumber(phone: string): string;
/**
 * Format a phone number for UI display.
 */
export declare function formatPhoneNumber(phone: string): string;
/**
 * Comprehensive CallRecord validator enforcing data contract rules.
 */
export declare function validateCallRecord(record: Partial<CallRecord>): ValidationResult;
