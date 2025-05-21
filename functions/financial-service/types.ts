// Financial data types
export interface TimeRange {
  from_date: string;
  to_date: string;
}

export interface Revenue {
  period: string;
  amount: number;
  previousPeriodAmount?: number;
  changePercentage?: number;
  currency: string;
  breakdown?: Record<string, number>;
}

export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  status: string;
  days_overdue?: number;
  currency: string;
}

export interface Expense {
  period: string;
  amount: number;
  previousPeriodAmount?: number;
  changePercentage?: number;
  currency: string;
  breakdown?: Record<string, number>;
}

export interface Account {
  account_id: string;
  account_name: string;
  account_type: string;
  balance: number;
  currency: string;
}

export interface CashFlow {
  period: string;
  starting_balance: number;
  ending_balance: number;
  net_change: number;
  inflow: number;
  outflow: number;
  currency: string;
}

// Zoho API response types
export interface ZohoResponse<T> {
  code: number;
  message: string;
  data?: T;
}

// Token response from auth service
export interface TokenResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    api_domain: string;
    token_type: string;
    expires_in: number;
    created_at: number;
  };
  error?: string;
}

// API Request params
export interface RevenueParams {
  period: string;
  compare_with_previous?: boolean;
}

export interface InvoiceParams {
  status?: string;
  from_date?: string;
  to_date?: string;
  customer_id?: string;
}

export interface ExpenseParams {
  period: string;
  compare_with_previous?: boolean;
}

export interface AccountParams {
  account_type?: string;
}

export interface CashFlowParams {
  period: string;
}