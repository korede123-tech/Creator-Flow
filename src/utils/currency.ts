/**
 * Currency utilities for Dobble Tap
 * Supports multi-currency with Nigeria-first approach
 */

export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'ZAR';

export const CURRENCIES: Record<Currency, { symbol: string; name: string; locale: string }> = {
  NGN: { symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  EUR: { symbol: '€', name: 'Euro', locale: 'en-EU' },
  ZAR: { symbol: 'R', name: 'South African Rand', locale: 'en-ZA' }
};

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: Currency = 'NGN'): string {
  const curr = CURRENCIES[currency];
  return `${curr.symbol}${amount.toLocaleString(curr.locale, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  })}`;
}

/**
 * Format amount with full currency code
 */
export function formatCurrencyWithCode(amount: number, currency: Currency = 'NGN'): string {
  const curr = CURRENCIES[currency];
  return `${curr.symbol}${amount.toLocaleString(curr.locale, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  })} ${currency}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency = 'NGN'): string {
  return CURRENCIES[currency].symbol;
}

/**
 * Approximate conversion rates (would be fetched from API in production)
 * Base currency: NGN
 */
export const CONVERSION_RATES: Record<Currency, number> = {
  NGN: 1,
  USD: 0.0012,   // 1 NGN ≈ 0.0012 USD
  GBP: 0.00095,  // 1 NGN ≈ 0.00095 GBP
  EUR: 0.0011,   // 1 NGN ≈ 0.0011 EUR
  ZAR: 0.022     // 1 NGN ≈ 0.022 ZAR
};

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  
  // Convert to NGN first (base currency)
  const inNGN = from === 'NGN' ? amount : amount / CONVERSION_RATES[from];
  
  // Convert from NGN to target currency
  const result = to === 'NGN' ? inNGN : inNGN * CONVERSION_RATES[to];
  
  return Math.round(result);
}
