"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = __importDefault(require("express"));
const catalystSDK = __importStar(require("zcatalyst-sdk-node"));
const zoho_books_1 = require("./services/zoho-books");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Initialize Zoho Books service for a request
function getZohoBooksService(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const userIdentifier = req.query.user || 'default';
        catalystSDK.initialize(req);
        const service = new zoho_books_1.ZohoBooksService();
        yield service.initialize(userIdentifier);
        return service;
    });
}
// Get revenue
app.get('/revenue', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const period = req.query.period || 'this_month';
        const compareWithPrevious = req.query.compare === 'true';
        const service = yield getZohoBooksService(req);
        const revenue = yield service.getRevenue({ period, compare_with_previous: compareWithPrevious });
        res.json({ success: true, data: revenue });
    }
    catch (error) {
        console.error('Error getting revenue:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
// Get invoices
app.get('/invoices', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = req.query.status;
        const fromDate = req.query.from_date;
        const toDate = req.query.to_date;
        const customerId = req.query.customer_id;
        const service = yield getZohoBooksService(req);
        const invoices = yield service.getInvoices({
            status,
            from_date: fromDate,
            to_date: toDate,
            customer_id: customerId
        });
        res.json({ success: true, data: invoices });
    }
    catch (error) {
        console.error('Error getting invoices:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
// Get overdue invoices
app.get('/invoices/overdue', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const service = yield getZohoBooksService(req);
        const invoices = yield service.getOverdueInvoices();
        res.json({ success: true, data: invoices });
    }
    catch (error) {
        console.error('Error getting overdue invoices:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
// Get expenses
app.get('/expenses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const period = req.query.period || 'this_month';
        const compareWithPrevious = req.query.compare === 'true';
        const service = yield getZohoBooksService(req);
        const expenses = yield service.getExpenses({ period, compare_with_previous: compareWithPrevious });
        res.json({ success: true, data: expenses });
    }
    catch (error) {
        console.error('Error getting expenses:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
// Get accounts
app.get('/accounts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountType = req.query.account_type;
        const service = yield getZohoBooksService(req);
        const accounts = yield service.getAccounts({ account_type: accountType });
        res.json({ success: true, data: accounts });
    }
    catch (error) {
        console.error('Error getting accounts:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
// Get cash on hand
app.get('/cash', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const service = yield getZohoBooksService(req);
        const cashOnHand = yield service.getCashOnHand();
        res.json({ success: true, data: { amount: cashOnHand, currency: 'USD' } });
    }
    catch (error) {
        console.error('Error getting cash on hand:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
// Get cash flow
app.get('/cashflow', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const period = req.query.period || 'this_month';
        const service = yield getZohoBooksService(req);
        const cashFlow = yield service.getCashFlow({ period });
        res.json({ success: true, data: cashFlow });
    }
    catch (error) {
        console.error('Error getting cash flow:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Financial service is running' });
});
module.exports = app;
