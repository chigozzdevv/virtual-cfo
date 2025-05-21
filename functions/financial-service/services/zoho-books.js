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
exports.ZohoBooksService = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../utils");
class ZohoBooksService {
    constructor() {
        this.baseUrl = '';
        this.organizationId = '';
        this.accessToken = '';
    }
    /**
     * Initialize the service with authentication tokens
     */
    initialize() {
        return __awaiter(this, arguments, void 0, function* (userIdentifier = 'default') {
            try {
                const tokenResponse = yield (0, utils_1.getAuthTokens)(userIdentifier);
                if (!tokenResponse.success || !tokenResponse.data) {
                    throw new Error(tokenResponse.error || 'Failed to get tokens');
                }
                const { access_token, api_domain } = tokenResponse.data;
                this.accessToken = access_token;
                this.baseUrl = `https://${api_domain}/books/v3`;
                // Get organization ID
                this.organizationId = yield this.getOrganizationId();
                return true;
            }
            catch (error) {
                console.error('Error initializing Zoho Books service:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to initialize Zoho Books service: ${errorMessage}`);
            }
        });
    }
    /**
     * Get the organization ID
     */
    getOrganizationId() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/organizations`, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                const organizations = response.data.organizations || [];
                if (organizations.length === 0) {
                    throw new Error('No organizations found');
                }
                return organizations[0].organization_id;
            }
            catch (error) {
                console.error('Error getting organization ID:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to get organization ID: ${errorMessage}`);
            }
        });
    }
    /**
     * Get revenue for a specific period
     */
    getRevenue(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ensure we're initialized
                if (!this.organizationId || !this.accessToken) {
                    yield this.initialize();
                }
                const timeRange = (0, utils_1.getDateRangeForPeriod)(params.period);
                // Get invoices for the period
                const invoicesUrl = `${this.baseUrl}/invoices?organization_id=${this.organizationId}&from_date=${timeRange.from_date}&to_date=${timeRange.to_date}`;
                const invoicesResponse = yield axios_1.default.get(invoicesUrl, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                const invoices = invoicesResponse.data.invoices || [];
                const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
                // Get previous period data if requested
                let previousPeriodAmount = undefined;
                let changePercentage = undefined;
                if (params.compare_with_previous) {
                    let previousPeriod = '';
                    switch (params.period) {
                        case 'this_month':
                            previousPeriod = 'last_month';
                            break;
                        case 'last_month':
                            // Two months ago
                            previousPeriod = 'two_months_ago';
                            break;
                        case 'this_quarter':
                            previousPeriod = 'last_quarter';
                            break;
                        case 'last_quarter':
                            // Two quarters ago
                            previousPeriod = 'two_quarters_ago';
                            break;
                        case 'this_year':
                            previousPeriod = 'last_year';
                            break;
                        default:
                            // No previous period
                            previousPeriod = '';
                    }
                    if (previousPeriod) {
                        const previousRevenue = yield this.getRevenue({ period: previousPeriod });
                        previousPeriodAmount = previousRevenue.amount;
                        changePercentage = (0, utils_1.calculatePercentageChange)(totalRevenue, previousPeriodAmount);
                    }
                }
                // Get breakdown by customer
                const breakdown = {};
                invoices.forEach((invoice) => {
                    const customerName = invoice.customer_name;
                    breakdown[customerName] = (breakdown[customerName] || 0) + invoice.total;
                });
                return {
                    period: params.period,
                    amount: totalRevenue,
                    previousPeriodAmount,
                    changePercentage,
                    currency: 'USD', // Default to USD, can get from invoices if needed
                    breakdown
                };
            }
            catch (error) {
                console.error('Error getting revenue:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to get revenue: ${errorMessage}`);
            }
        });
    }
    /**
     * Get invoices based on parameters
     */
    getInvoices() {
        return __awaiter(this, arguments, void 0, function* (params = {}) {
            try {
                // Ensure we're initialized
                if (!this.organizationId || !this.accessToken) {
                    yield this.initialize();
                }
                // Build URL with parameters
                let url = `${this.baseUrl}/invoices?organization_id=${this.organizationId}`;
                if (params.status) {
                    url += `&status=${params.status}`;
                }
                if (params.from_date) {
                    url += `&from_date=${params.from_date}`;
                }
                if (params.to_date) {
                    url += `&to_date=${params.to_date}`;
                }
                if (params.customer_id) {
                    url += `&customer_id=${params.customer_id}`;
                }
                // Get invoices
                const response = yield axios_1.default.get(url, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                const invoices = response.data.invoices || [];
                // Map to our interface
                return invoices.map((invoice) => {
                    const daysOverdue = invoice.due_date && new Date(invoice.due_date) < new Date()
                        ? (0, utils_1.calculateDaysOverdue)(invoice.due_date)
                        : 0;
                    return {
                        invoice_id: invoice.invoice_id,
                        invoice_number: invoice.invoice_number,
                        customer_name: invoice.customer_name,
                        date: invoice.date,
                        due_date: invoice.due_date,
                        total: invoice.total,
                        balance: invoice.balance,
                        status: invoice.status,
                        days_overdue: daysOverdue,
                        currency: invoice.currency_code || 'USD'
                    };
                });
            }
            catch (error) {
                console.error('Error getting invoices:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to get invoices: ${errorMessage}`);
            }
        });
    }
    /**
     * Get overdue invoices
     */
    getOverdueInvoices() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getInvoices({ status: 'overdue' });
        });
    }
    /**
     * Get expenses for a specific period
     */
    getExpenses(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ensure we're initialized
                if (!this.organizationId || !this.accessToken) {
                    yield this.initialize();
                }
                const timeRange = (0, utils_1.getDateRangeForPeriod)(params.period);
                // Get expenses for the period
                const expensesUrl = `${this.baseUrl}/bills?organization_id=${this.organizationId}&from_date=${timeRange.from_date}&to_date=${timeRange.to_date}`;
                const expensesResponse = yield axios_1.default.get(expensesUrl, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                const bills = expensesResponse.data.bills || [];
                const totalExpenses = bills.reduce((sum, bill) => sum + bill.total, 0);
                // Get previous period data if requested
                let previousPeriodAmount = undefined;
                let changePercentage = undefined;
                if (params.compare_with_previous) {
                    let previousPeriod = '';
                    switch (params.period) {
                        case 'this_month':
                            previousPeriod = 'last_month';
                            break;
                        case 'last_month':
                            // Two months ago
                            previousPeriod = 'two_months_ago';
                            break;
                        case 'this_quarter':
                            previousPeriod = 'last_quarter';
                            break;
                        case 'last_quarter':
                            // Two quarters ago
                            previousPeriod = 'two_quarters_ago';
                            break;
                        case 'this_year':
                            previousPeriod = 'last_year';
                            break;
                        default:
                            // No previous period
                            previousPeriod = '';
                    }
                    if (previousPeriod) {
                        const previousExpenses = yield this.getExpenses({ period: previousPeriod });
                        previousPeriodAmount = previousExpenses.amount;
                        changePercentage = (0, utils_1.calculatePercentageChange)(totalExpenses, previousPeriodAmount);
                    }
                }
                // Get breakdown by vendor
                const breakdown = {};
                bills.forEach((bill) => {
                    const vendorName = bill.vendor_name;
                    breakdown[vendorName] = (breakdown[vendorName] || 0) + bill.total;
                });
                return {
                    period: params.period,
                    amount: totalExpenses,
                    previousPeriodAmount,
                    changePercentage,
                    currency: 'USD', // Default to USD, can get from bills if needed
                    breakdown
                };
            }
            catch (error) {
                console.error('Error getting expenses:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to get expenses: ${errorMessage}`);
            }
        });
    }
    /**
     * Get accounts based on parameters
     */
    getAccounts() {
        return __awaiter(this, arguments, void 0, function* (params = {}) {
            try {
                // Ensure we're initialized
                if (!this.organizationId || !this.accessToken) {
                    yield this.initialize();
                }
                // Build URL with parameters
                let url = `${this.baseUrl}/chartofaccounts?organization_id=${this.organizationId}`;
                if (params.account_type) {
                    url += `&account_type=${params.account_type}`;
                }
                // Get accounts
                const response = yield axios_1.default.get(url, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                const accounts = response.data.chartofaccounts || [];
                // Map to our interface
                return accounts.map((account) => {
                    return {
                        account_id: account.account_id,
                        account_name: account.account_name,
                        account_type: account.account_type,
                        balance: account.current_balance,
                        currency: account.currency_code || 'USD'
                    };
                });
            }
            catch (error) {
                console.error('Error getting accounts:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to get accounts: ${errorMessage}`);
            }
        });
    }
    /**
     * Get cash on hand (from bank accounts)
     */
    getCashOnHand() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bankAccounts = yield this.getAccounts({ account_type: 'bank' });
                return bankAccounts.reduce((sum, account) => sum + account.balance, 0);
            }
            catch (error) {
                console.error('Error getting cash on hand:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to get cash on hand: ${errorMessage}`);
            }
        });
    }
    /**
     * Get cash flow for a specific period
     */
    getCashFlow(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ensure we're initialized
                if (!this.organizationId || !this.accessToken) {
                    yield this.initialize();
                }
                const timeRange = (0, utils_1.getDateRangeForPeriod)(params.period);
                // First, get the starting balance
                // Get bank accounts
                const bankAccounts = yield this.getAccounts({ account_type: 'bank' });
                // To get starting balance, we need to query the statement endpoints for each bank account
                let startingBalance = 0;
                let endingBalance = 0;
                let inflow = 0;
                let outflow = 0;
                for (const account of bankAccounts) {
                    // For each bank account, get the statement
                    const statementUrl = `${this.baseUrl}/bankaccounts/${account.account_id}/statement?organization_id=${this.organizationId}&from_date=${timeRange.from_date}&to_date=${timeRange.to_date}`;
                    const statementResponse = yield axios_1.default.get(statementUrl, {
                        headers: { 'Authorization': `Bearer ${this.accessToken}` }
                    });
                    const statement = statementResponse.data.statement || {};
                    startingBalance += statement.opening_balance || 0;
                    endingBalance += statement.closing_balance || 0;
                    // Transactions
                    const transactions = statement.transactions || [];
                    for (const transaction of transactions) {
                        if (transaction.debit_or_credit === 'credit') {
                            inflow += transaction.amount;
                        }
                        else {
                            outflow += transaction.amount;
                        }
                    }
                }
                const netChange = endingBalance - startingBalance;
                return {
                    period: params.period,
                    starting_balance: startingBalance,
                    ending_balance: endingBalance,
                    net_change: netChange,
                    inflow,
                    outflow,
                    currency: 'USD' // Default to USD
                };
            }
            catch (error) {
                console.error('Error getting cash flow:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to get cash flow: ${errorMessage}`);
            }
        });
    }
}
exports.ZohoBooksService = ZohoBooksService;
