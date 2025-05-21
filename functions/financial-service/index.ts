import express from 'express';
import { Request, Response } from 'express';
import * as catalystSDK from 'zcatalyst-sdk-node';
import { ZohoBooksService } from './services/zoho-books';
import { getDateRangeForPeriod } from './utils';

const app = express();

app.use(express.json());

// Initialize Zoho Books service for a request
async function getZohoBooksService(req: Request): Promise<ZohoBooksService> {
  const userIdentifier = req.query.user as string || 'default';
  
  catalystSDK.initialize(req);
  
  const service = new ZohoBooksService();
  await service.initialize(userIdentifier);
  
  return service;
}

// Get revenue
app.get('/revenue', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || 'this_month';
    const compareWithPrevious = req.query.compare === 'true';
    
    const service = await getZohoBooksService(req);
    const revenue = await service.getRevenue({ period, compare_with_previous: compareWithPrevious });
    
    res.json({ success: true, data: revenue });
  } catch (error: unknown) {
    console.error('Error getting revenue:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get invoices
app.get('/invoices', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const fromDate = req.query.from_date as string;
    const toDate = req.query.to_date as string;
    const customerId = req.query.customer_id as string;
    
    const service = await getZohoBooksService(req);
    const invoices = await service.getInvoices({
      status,
      from_date: fromDate,
      to_date: toDate,
      customer_id: customerId
    });
    
    res.json({ success: true, data: invoices });
  } catch (error: unknown) {
    console.error('Error getting invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get overdue invoices
app.get('/invoices/overdue', async (req: Request, res: Response) => {
  try {
    const service = await getZohoBooksService(req);
    const invoices = await service.getOverdueInvoices();
    
    res.json({ success: true, data: invoices });
  } catch (error: unknown) {
    console.error('Error getting overdue invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get expenses
app.get('/expenses', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || 'this_month';
    const compareWithPrevious = req.query.compare === 'true';
    
    const service = await getZohoBooksService(req);
    const expenses = await service.getExpenses({ period, compare_with_previous: compareWithPrevious });
    
    res.json({ success: true, data: expenses });
  } catch (error: unknown) {
    console.error('Error getting expenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get accounts
app.get('/accounts', async (req: Request, res: Response) => {
  try {
    const accountType = req.query.account_type as string;
    
    const service = await getZohoBooksService(req);
    const accounts = await service.getAccounts({ account_type: accountType });
    
    res.json({ success: true, data: accounts });
  } catch (error: unknown) {
    console.error('Error getting accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get cash on hand
app.get('/cash', async (req: Request, res: Response) => {
  try {
    const service = await getZohoBooksService(req);
    const cashOnHand = await service.getCashOnHand();
    
    res.json({ success: true, data: { amount: cashOnHand, currency: 'USD' } });
  } catch (error: unknown) {
    console.error('Error getting cash on hand:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get cash flow
app.get('/cashflow', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || 'this_month';
    
    const service = await getZohoBooksService(req);
    const cashFlow = await service.getCashFlow({ period });
    
    res.json({ success: true, data: cashFlow });
  } catch (error: unknown) {
    console.error('Error getting cash flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Financial service is running' });
});

export = app;