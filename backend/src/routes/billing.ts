import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import {
  createInvoiceItem,
  deleteInvoice,
  deleteInvoiceItem,
  generateInvoice,
  getInvoice,
  listInvoices,
  previewBilling,
  updateInvoice,
  updateInvoiceItem,
} from '../controllers/billingController'

export const billingRouter = Router()

// Invoicing is Super Admin only for now (matches frontend nav restrictions)
billingRouter.use(requireAuth, requireRole(['SUPER_ADMIN']))

billingRouter.get('/billing/preview', previewBilling)
billingRouter.post('/billing/invoices', generateInvoice)
billingRouter.get('/billing/invoices', listInvoices)
billingRouter.get('/billing/invoices/:id', getInvoice)
billingRouter.put('/billing/invoices/:id', updateInvoice)
billingRouter.delete('/billing/invoices/:id', deleteInvoice)

billingRouter.put('/billing/invoices/:id/items/:itemId', updateInvoiceItem)
billingRouter.delete('/billing/invoices/:id/items/:itemId', deleteInvoiceItem)
billingRouter.post('/billing/invoices/:id/items', createInvoiceItem)

