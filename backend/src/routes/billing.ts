import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { generateInvoice, getInvoice, listInvoices, previewBilling } from '../controllers/billingController'

export const billingRouter = Router()

// Invoicing is Super Admin only for now (matches frontend nav restrictions)
billingRouter.use(requireAuth, requireRole(['SUPER_ADMIN']))

billingRouter.get('/billing/preview', previewBilling)
billingRouter.post('/billing/invoices', generateInvoice)
billingRouter.get('/billing/invoices', listInvoices)
billingRouter.get('/billing/invoices/:id', getInvoice)

