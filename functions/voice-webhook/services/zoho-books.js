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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZohoBooksService = void 0;
/**
 * Simple stub for Zoho Books service
 * This will be expanded in Part 2 with actual API integration
 */
class ZohoBooksService {
    getRevenueForPeriod(period) {
        return __awaiter(this, void 0, void 0, function* () {
            // In Part 1, we'll return mock data
            // This will be replaced with actual Zoho Books API calls in Part 2
            const mockRevenue = {
                'this_month': 125000,
                'last_month': 130000,
                'this_quarter': 380000,
                'last_quarter': 410000,
                'this_year': 1550000,
                'last_year': 1350000
            };
            return mockRevenue[period] || 0;
        });
    }
    getOverdueInvoices() {
        return __awaiter(this, void 0, void 0, function* () {
            // Mock data for Part 1
            return [
                {
                    invoice_id: 'INV-001',
                    customer_name: 'Acme Corp',
                    balance: 5000,
                    days_overdue: 15
                },
                {
                    invoice_id: 'INV-002',
                    customer_name: 'Globex Industries',
                    balance: 7500,
                    days_overdue: 10
                }
            ];
        });
    }
    getCashOnHand() {
        return __awaiter(this, void 0, void 0, function* () {
            // Mock data for Part 1
            return 250000;
        });
    }
}
exports.ZohoBooksService = ZohoBooksService;
