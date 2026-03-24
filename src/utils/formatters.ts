// Utility functions for formatting data

/**
 * Format a number as GBP currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format a large number with K/M suffix
 */
export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1000000) {
    return '£' + (amount / 1000000).toFixed(1) + 'm';
  }
  if (amount >= 1000) {
    return '£' + (amount / 1000).toFixed(0) + 'k';
  }
  return formatCurrency(amount);
};

/**
 * Format a date consistently across the app
 */
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format a date with time
 */
export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  const dateStr = formatDate(d);
  const timeStr = d.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
  return `${dateStr} - ${timeStr}`;
};

/**
 * Calculate agent fee based on type (percentage or fixed)
 */
export const calculateAgentFee = (
  budget: string | number,
  feeType: 'percentage' | 'fixed',
  feeValue: string | number
): number => {
  const budgetNum = typeof budget === 'string' ? parseFloat(budget) || 0 : budget;
  const feeNum = typeof feeValue === 'string' ? parseFloat(feeValue) || 0 : feeValue;
  
  if (feeType === 'percentage') {
    return budgetNum * (feeNum / 100);
  }
  return feeNum;
};

/**
 * Calculate surveyor fee based on type (percentage or fixed)
 */
export const calculateSurveyorFee = (
  budget: string | number,
  feeType: 'percentage' | 'fixed',
  feeValue: string | number
): number => {
  return calculateAgentFee(budget, feeType, feeValue);
};

/**
 * Calculate total estimated cost
 */
export const calculateTotalCost = (
  budget: string | number,
  agentFee: number,
  surveyorFee: number
): number => {
  const budgetNum = typeof budget === 'string' ? parseFloat(budget) || 0 : budget;
  return budgetNum + agentFee + surveyorFee;
};

/**
 * Get property label from estate and building codes
 */
export const getPropertyLabel = (estate: string, building: string): string => {
  const estateLabels: Record<string, string> = {
    'burns-court': 'Burns Court',
    'riverside-apartments': 'Riverside Apartments',
    'parkside-estate': 'Parkside Estate',
    'westside-towers': 'Westside Towers'
  };
  
  const buildingLabels: Record<string, string> = {
    'riverside-block': 'Riverside Block',
    'parkview-block': 'Parkview Block',
    'central-tower': 'Central Tower',
    'tower-a': 'Tower A',
    'tower-b': 'Tower B'
  };
  
  const estateName = estateLabels[estate] || estate;
  const buildingName = buildingLabels[building] || building;
  
  return `${estateName} - ${buildingName}`;
};
