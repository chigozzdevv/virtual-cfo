import axios from 'axios';
import { TimeRange, TokenResponse } from './types';

// Get tokens from auth service
export async function getAuthTokens(userIdentifier: string = 'default'): Promise<TokenResponse> {
  const authServiceUrl = process.env.AUTH_SERVICE_URL;
  
  if (!authServiceUrl) {
    throw new Error('AUTH_SERVICE_URL environment variable is not set');
  }
  
  try {
    const response = await axios.get(`${authServiceUrl}/tokens?user=${userIdentifier}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error getting auth tokens:', error);
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        error: error.response.data.error || 'Unknown error from auth service'
      };
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to get tokens: ${errorMessage}`
    };
  }
}

// Get date range for specific period
export function getDateRangeForPeriod(period: string): TimeRange {
  const now = new Date();
  let fromDate: Date;
  let toDate: Date = now;
  
  switch (period) {
    case 'this_month':
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'this_quarter':
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      fromDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      break;
    case 'last_quarter':
      const lastQuarterStartMonth = Math.floor((now.getMonth() - 3) / 3) * 3;
      fromDate = new Date(now.getFullYear(), lastQuarterStartMonth, 1);
      toDate = new Date(now.getFullYear(), lastQuarterStartMonth + 3, 0);
      break;
    case 'this_year':
      fromDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'last_year':
      fromDate = new Date(now.getFullYear() - 1, 0, 1);
      toDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    default:
      // Default to this month
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  return {
    from_date: formatDate(fromDate),
    to_date: formatDate(toDate)
  };
}

// Calculate days overdue
export function calculateDaysOverdue(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  
  // Reset hours to get accurate day difference
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

// Format currency for display
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  
  return ((current - previous) / previous) * 100;
}