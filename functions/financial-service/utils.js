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
exports.getAuthTokens = getAuthTokens;
exports.getDateRangeForPeriod = getDateRangeForPeriod;
exports.calculateDaysOverdue = calculateDaysOverdue;
exports.formatCurrency = formatCurrency;
exports.calculatePercentageChange = calculatePercentageChange;
const axios_1 = __importDefault(require("axios"));
// Get tokens from auth service
function getAuthTokens() {
    return __awaiter(this, arguments, void 0, function* (userIdentifier = 'default') {
        const authServiceUrl = process.env.AUTH_SERVICE_URL;
        if (!authServiceUrl) {
            throw new Error('AUTH_SERVICE_URL environment variable is not set');
        }
        try {
            const response = yield axios_1.default.get(`${authServiceUrl}/tokens?user=${userIdentifier}`);
            return response.data;
        }
        catch (error) {
            console.error('Error getting auth tokens:', error);
            if (axios_1.default.isAxiosError(error) && error.response) {
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
    });
}
// Get date range for specific period
function getDateRangeForPeriod(period) {
    const now = new Date();
    let fromDate;
    let toDate = now;
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
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    return {
        from_date: formatDate(fromDate),
        to_date: formatDate(toDate)
    };
}
// Calculate days overdue
function calculateDaysOverdue(dueDate) {
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
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}
// Calculate percentage change
function calculatePercentageChange(current, previous) {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
}
