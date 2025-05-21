import axios from 'axios';
import { FunctionHandler } from '../types';
import { formatPeriod } from '../utils';

// Financial service URL from environment variables
const FINANCIAL_SERVICE_URL = process.env.FINANCIAL_SERVICE_URL || '';

if (!FINANCIAL_SERVICE_URL) {
  console.warn('FINANCIAL_SERVICE_URL environment variable is not set. Financial data will not be available.');
}

/**
 * Function handlers that call the financial-service API
 */
export const FUNCTION_HANDLERS: Record<string, FunctionHandler> = {
  /**
   * Get revenue for a specified period
   */
  getRevenueForPeriod: async (args: { period: string, compareWithPrevious?: boolean }) => {
    try {
      // Call the financial-service API
      const response = await axios.get(`${FINANCIAL_SERVICE_URL}/revenue`, {
        params: {
          period: args.period,
          compare: args.compareWithPrevious ? 'true' : 'false'
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get revenue data');
      }
      
      const revenue = response.data.data;
      
      // Format the response for the voice agent
      let readableResponse = `The revenue for ${formatPeriod(args.period)} is ${revenue.formattedAmount || `$${revenue.amount.toLocaleString()}`}.`;
      
      if (revenue.previousPeriodAmount !== undefined && revenue.changePercentage !== undefined) {
        const changeDirection = revenue.changePercentage >= 0 ? 'increased' : 'decreased';
        readableResponse += ` This has ${changeDirection} by ${Math.abs(revenue.changePercentage).toFixed(1)}% compared to the previous period.`;
      }
      
      return {
        ...revenue,
        readableResponse
      };
    } catch (error: unknown) {
      console.error('Error getting revenue:', error);
      throw new Error('Failed to retrieve revenue data. Please ensure the financial service is available.');
    }
  },
  
  /**
   * Get overdue invoices
   */
  getOverdueInvoices: async () => {
    try {
      // Call the financial-service API
      const response = await axios.get(`${FINANCIAL_SERVICE_URL}/invoices/overdue`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get overdue invoices');
      }
      
      const invoices = response.data.data;
      const totalAmount = invoices.reduce((sum: number, inv: any) => sum + inv.balance, 0);
      
      // Format the response for the voice agent
      let readableResponse = `There are ${invoices.length} overdue invoices totaling $${totalAmount.toLocaleString()}.`;
      
      if (invoices.length > 0) {
        // Add details about the largest invoice
        const largestInvoice = [...invoices].sort((a, b) => b.balance - a.balance)[0];
        readableResponse += ` The largest is from ${largestInvoice.customer_name} for $${largestInvoice.balance.toLocaleString()}, which is ${largestInvoice.days_overdue} days overdue.`;
      }
      
      return {
        count: invoices.length,
        totalAmount,
        formattedAmount: `$${totalAmount.toLocaleString()}`,
        invoices: invoices.map((inv: any) => ({
          id: inv.invoice_id,
          customer: inv.customer_name,
          amount: inv.balance,
          daysOverdue: inv.days_overdue
        })),
        readableResponse
      };
    } catch (error: unknown) {
      console.error('Error getting overdue invoices:', error);
      throw new Error('Failed to retrieve overdue invoices. Please ensure the financial service is available.');
    }
  },
  
  /**
   * Get expenses for a specified period
   */
  getExpensesForPeriod: async (args: { period: string, compareWithPrevious?: boolean }) => {
    try {
      // Call the financial-service API
      const response = await axios.get(`${FINANCIAL_SERVICE_URL}/expenses`, {
        params: {
          period: args.period,
          compare: args.compareWithPrevious ? 'true' : 'false'
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get expense data');
      }
      
      const expenses = response.data.data;
      
      // Format the response for the voice agent
      let readableResponse = `The expenses for ${formatPeriod(args.period)} are ${expenses.formattedAmount || `$${expenses.amount.toLocaleString()}`}.`;
      
      if (expenses.previousPeriodAmount !== undefined && expenses.changePercentage !== undefined) {
        const changeDirection = expenses.changePercentage >= 0 ? 'increased' : 'decreased';
        readableResponse += ` This has ${changeDirection} by ${Math.abs(expenses.changePercentage).toFixed(1)}% compared to the previous period.`;
      }
      
      return {
        ...expenses,
        readableResponse
      };
    } catch (error: unknown) {
      console.error('Error getting expenses:', error);
      throw new Error('Failed to retrieve expense data. Please ensure the financial service is available.');
    }
  },
  
  /**
   * Get current cash on hand
   */
  getCashOnHand: async () => {
    try {
      // Call the financial-service API
      const response = await axios.get(`${FINANCIAL_SERVICE_URL}/cash`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get cash data');
      }
      
      const cashData = response.data.data;
      
      // Format the response for the voice agent
      const readableResponse = `The current cash on hand is $${cashData.amount.toLocaleString()}.`;
      
      return {
        amount: cashData.amount,
        formattedAmount: `$${cashData.amount.toLocaleString()}`,
        currency: cashData.currency || 'USD',
        readableResponse
      };
    } catch (error: unknown) {
      console.error('Error getting cash on hand:', error);
      throw new Error('Failed to retrieve cash on hand data. Please ensure the financial service is available.');
    }
  },
  
  /**
   * Get cash flow for a specified period
   */
  getCashFlow: async (args: { period: string }) => {
    try {
      // Call the financial-service API
      const response = await axios.get(`${FINANCIAL_SERVICE_URL}/cashflow`, {
        params: {
          period: args.period
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get cash flow data');
      }
      
      const cashFlow = response.data.data;
      
      // Format the response for the voice agent
      let readableResponse = `For ${formatPeriod(args.period)}, the cash flow started at $${cashFlow.starting_balance.toLocaleString()} and ended at $${cashFlow.ending_balance.toLocaleString()}.`;
      
      if (cashFlow.net_change > 0) {
        readableResponse += ` This represents a net increase of $${cashFlow.net_change.toLocaleString()}.`;
      } else if (cashFlow.net_change < 0) {
        readableResponse += ` This represents a net decrease of $${Math.abs(cashFlow.net_change).toLocaleString()}.`;
      } else {
        readableResponse += ` There was no net change in cash.`;
      }
      
      return {
        ...cashFlow,
        readableResponse
      };
    } catch (error: unknown) {
      console.error('Error getting cash flow:', error);
      throw new Error('Failed to retrieve cash flow data. Please ensure the financial service is available.');
    }
  },
  
  /**
   * Default response generator when no specific function is called
   */
  generateResponse: async (args: { text: string }) => {
    return {
      text: args.text,
      readableResponse: args.text
    };
  }
};