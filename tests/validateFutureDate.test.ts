import { describe, it, expect } from 'vitest';
import { validateFutureDate } from '../lib/validation';

// Test unitario para la función validateFutureDate

describe('validateFutureDate', () => {
  it('devuelve válido para una fecha futura', () => {
    const result = validateFutureDate('2099-12-31', 1);
    expect(result.valid).toBe(true);
  });

  it('devuelve inválido para una fecha pasada', () => {
    const result = validateFutureDate('2000-01-01', 1);
    expect(result.valid).toBe(false);
  });

  it('devuelve inválido si la fecha es hoy y minDaysFromNow > 0', () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = validateFutureDate(today, 1);
    expect(result.valid).toBe(false);
  });

  it('devuelve válido si la fecha es hoy y minDaysFromNow = 0', () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = validateFutureDate(today, 0);
    expect(result.valid).toBe(true);
  });
});
