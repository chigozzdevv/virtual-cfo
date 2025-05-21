/**
 * Simple stub for Zoho Books service
 * This will be expanded in Part 2 with actual API integration
 */
export class ZohoBooksService {
  async getRevenueForPeriod(period: string): Promise<number> {
    // In Part 1, we'll return mock data
    // This will be replaced with actual Zoho Books API calls in Part 2
    const mockRevenue: Record<string, number> = {
      'this_month': 125000,
      'last_month': 130000,
      'this_quarter': 380000,
      'last_quarter': 410000,
      'this_year': 1550000,
      'last_year': 1350000
    };
    
    return mockRevenue[period] || 0;
  }
  
  async getOverdueInvoices(): Promise<any[]> {
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
  }
  
  async getCashOnHand(): Promise<number> {
    // Mock data for Part 1
    return 250000;
  }
}