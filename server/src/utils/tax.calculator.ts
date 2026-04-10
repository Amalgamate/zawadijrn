/**
 * tax.calculator.ts
 * Implements Kenyan Statutory Deductions based on 2024 Tax Laws.
 * Reference: KRA iTax, NSSF Act 2013, SHIF 2024 regulations.
 */

export interface TaxDeductions {
  paye: number;
  nssf: number;
  shif: number;
  housingLevy: number;
  totalDeductions: number;
  netSalary: number;
}

export class TaxCalculator {
  // 2024 PAYE Tiers
  private static PAYE_TIERS = [
    { upper: 24000, rate: 0.10 },
    { upper: 32333, rate: 0.25 },
    { upper: 500000, rate: 0.30 },
    { upper: 800000, rate: 0.325 },
    { upper: Infinity, rate: 0.35 }
  ];

  private static PERSONAL_RELIEF = 2400;
  private static INSURANCE_RELIEF_RATE = 0.15; // 15% of NHIF/SHIF contribution

  /**
   * Calculate Pay As You Earn (PAYE)
   */
  static calculatePAYE(taxableIncome: number, shifAmount: number = 0): number {
    if (taxableIncome <= 24000) return 0;

    let tax = 0;
    let remaining = taxableIncome;
    let previousUpper = 0;

    for (const tier of this.PAYE_TIERS) {
      const tierWidth = tier.upper - previousUpper;
      const taxableInTier = Math.min(remaining, tierWidth);
      
      tax += taxableInTier * tier.rate;
      remaining -= taxableInTier;
      previousUpper = tier.upper;

      if (remaining <= 0) break;
    }

    // Apply Reliefs
    const insuranceRelief = shifAmount * this.INSURANCE_RELIEF_RATE;
    const finalTax = Math.max(0, tax - this.PERSONAL_RELIEF - insuranceRelief);

    return parseFloat(finalTax.toFixed(2));
  }

  /**
   * Calculate NSSF (New Rates Act 2013)
   * Tier I (6% of first 7,000) = 420
   * Tier II (6% of balance up to 36,000) = 1,740
   */
  static calculateNSSF(grossSalary: number): number {
    const tier1Limit = 7000;
    const tier2Limit = 36000;

    const tier1 = Math.min(grossSalary, tier1Limit) * 0.06;
    const tier2 = grossSalary > tier1Limit 
      ? (Math.min(grossSalary, tier2Limit) - tier1Limit) * 0.06 
      : 0;

    return parseFloat((tier1 + tier2).toFixed(2));
  }

  /**
   * Calculate Social Health Insurance Fund (SHIF)
   * 2.75% of Gross Salary (No cap)
   */
  static calculateSHIF(grossSalary: number): number {
    return parseFloat((grossSalary * 0.0275).toFixed(2));
  }

  /**
   * Calculate Affordable Housing Levy
   * 1.5% of Gross Salary
   */
  static calculateHousingLevy(grossSalary: number): number {
    return parseFloat((grossSalary * 0.015).toFixed(2));
  }

  /**
   * Get full deduction breakdown
   */
  static getBreakdown(grossSalary: number, options: { exemptLevy?: boolean } = {}): TaxDeductions {
    const nssf = this.calculateNSSF(grossSalary);
    const shif = this.calculateSHIF(grossSalary);
    const housingLevy = options.exemptLevy ? 0 : this.calculateHousingLevy(grossSalary);
    
    // Taxable income = Gross - NSSF (NSSF is tax-deductible)
    const taxableIncome = grossSalary - nssf;
    const paye = this.calculatePAYE(taxableIncome, shif);

    const totalDeductions = paye + nssf + shif + housingLevy;
    const netSalary = grossSalary - totalDeductions;

    return {
      paye,
      nssf,
      shif,
      housingLevy,
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
      netSalary: parseFloat(netSalary.toFixed(2))
    };
  }
}
