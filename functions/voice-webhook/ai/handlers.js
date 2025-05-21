"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FUNCTION_HANDLERS = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../utils");
// Financial service URL from environment variables
const FINANCIAL_SERVICE_URL = process.env.FINANCIAL_SERVICE_URL || '';
if (!FINANCIAL_SERVICE_URL) {
    console.warn('FINANCIAL_SERVICE_URL environment variable is not set. Financial data will not be available.');
}
/**
 * Function handlers that call the financial-service API
 */
exports.FUNCTION_HANDLERS = {
    /**
     * Get revenue for a specified period
     */
    getRevenueForPeriod: (args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Call the financial-service API
            const response = yield axios_1.default.get(`${FINANCIAL_SERVICE_URL}/revenue`, {
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
            let readableResponse = `The revenue for ${(0, utils_1.formatPeriod)(args.period)} is ${revenue.formattedAmount || `$${revenue.amount.toLocaleString()}`}.`;
            if (revenue.previousPeriodAmount !== undefined && revenue.changePercentage !== undefined) {
                const changeDirection = revenue.changePercentage >= 0 ? 'increased' : 'decreased';
                readableResponse += ` This has ${changeDirection} by ${Math.abs(revenue.changePercentage).toFixed(1)}% compared to the previous period.`;
            }
            return Object.assign(Object.assign({}, revenue), { readableResponse });
        }
        catch (error) {
            console.error('Error getting revenue:', error);
            throw new Error('Failed to retrieve revenue data. Please ensure the financial service is available.');
        }
    }),
    /**
     * Get overdue invoices
     */
    getOverdueInvoices: () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Call the financial-service API
            const response = yield axios_1.default.get(`${FINANCIAL_SERVICE_URL}/invoices/overdue`);
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to get overdue invoices');
            }
            const invoices = response.data.data;
            const totalAmount = invoices.reduce((sum, inv) => sum + inv.balance, 0);
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
                invoices: invoices.map((inv) => ({
                    id: inv.invoice_id,
                    customer: inv.customer_name,
                    amount: inv.balance,
                    daysOverdue: inv.days_overdue
                })),
                readableResponse
            };
        }
        catch (error) {
            console.error('Error getting overdue invoices:', error);
            throw new Error('Failed to retrieve overdue invoices. Please ensure the financial service is available.');
        }
    }),
    /**
     * Get expenses for a specified period
     */
    getExpensesForPeriod: (args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Call the financial-service API
            const response = yield axios_1.default.get(`${FINANCIAL_SERVICE_URL}/expenses`, {
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
            let readableResponse = `The expenses for ${(0, utils_1.formatPeriod)(args.period)} are ${expenses.formattedAmount || `$${expenses.amount.toLocaleString()}`}.`;
            if (expenses.previousPeriodAmount !== undefined && expenses.changePercentage !== undefined) {
                const changeDirection = expenses.changePercentage >= 0 ? 'increased' : 'decreased';
                readableResponse += ` This has ${changeDirection} by ${Math.abs(expenses.changePercentage).toFixed(1)}% compared to the previous period.`;
            }
            return Object.assign(Object.assign({}, expenses), { readableResponse });
        }
        catch (error) {
            console.error('Error getting expenses:', error);
            throw new Error('Failed to retrieve expense data. Please ensure the financial service is available.');
        }
    }),
    /**
     * Get current cash on hand
     */
    getCashOnHand: () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Call the financial-service API
            const response = yield axios_1.default.get(`${FINANCIAL_SERVICE_URL}/cash`);
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
        }
        catch (error) {
            console.error('Error getting cash on hand:', error);
            throw new Error('Failed to retrieve cash on hand data. Please ensure the financial service is available.');
        }
    }),
    /**
     * Get cash flow for a specified period
     */
    getCashFlow: (args) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Call the financial-service API
            const response = yield axios_1.default.get(`${FINANCIAL_SERVICE_URL}/cashflow`, {
                params: {
                    period: args.period
                }
            });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to get cash flow data');
            }
            const cashFlow = response.data.data;
            // Format the response for the voice agent
            let readableResponse = `For ${(0, utils_1.formatPeriod)(args.period)}, the cash flow started at $${cashFlow.starting_balance.toLocaleString()} and ended at $${cashFlow.ending_balance.toLocaleString()}.`;
            if (cashFlow.net_change > 0) {
                readableResponse += ` This represents a net increase of $${cashFlow.net_change.toLocaleString()}.`;
            }
            else if (cashFlow.net_change < 0) {
                readableResponse += ` This represents a net decrease of $${Math.abs(cashFlow.net_change).toLocaleString()}.`;
            }
            else {
                readableResponse += ` There was no net change in cash.`;
            }
            return Object.assign(Object.assign({}, cashFlow), { readableResponse });
        }
        catch (error) {
            console.error('Error getting cash flow:', error);
            throw new Error('Failed to retrieve cash flow data. Please ensure the financial service is available.');
        }
    }),
    /**
     * Default response generator when no specific function is called
     */
    generateResponse: (args) => __awaiter(void 0, void 0, void 0, function* () {
        return {
            text: args.text,
            readableResponse: args.text
        };
    })
};
