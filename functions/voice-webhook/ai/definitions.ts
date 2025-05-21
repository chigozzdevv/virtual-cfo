import { FunctionDefinition } from '../types';

/**
 * Function definitions for OpenAI
 * These now align with our financial-service API
 */
export const FUNCTION_DEFINITIONS: FunctionDefinition[] = [
  {
    name: 'getRevenueForPeriod',
    description: 'Get revenue information for a specific time period',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year'],
          description: 'The time period to get revenue for'
        },
        compareWithPrevious: {
          type: 'boolean',
          description: 'Whether to include comparison with the previous period'
        }
      },
      required: ['period']
    }
  },
  {
    name: 'getOverdueInvoices',
    description: 'Get a list of overdue invoices',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getExpensesForPeriod',
    description: 'Get expense information for a specific time period',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year'],
          description: 'The time period to get expenses for'
        },
        compareWithPrevious: {
          type: 'boolean',
          description: 'Whether to include comparison with the previous period'
        }
      },
      required: ['period']
    }
  },
  {
    name: 'getCashOnHand',
    description: 'Get the current cash on hand',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getCashFlow',
    description: 'Get cash flow information for a specific time period',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year'],
          description: 'The time period to get cash flow for'
        }
      },
      required: ['period']
    }
  },
  {
    name: 'generateResponse',
    description: 'Generate a text response when no specific function is needed',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text response to give to the user'
        }
      },
      required: ['text']
    }
  }
];