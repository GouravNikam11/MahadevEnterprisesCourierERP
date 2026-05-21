import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import {
  createCourierCompany,
  deleteCourierCompany,
  listCourierCompanies,
  updateCourierCompany,
} from '../controllers/courierCompanyController'
import { createPincode, deletePincode, listPincodes, updatePincode } from '../controllers/pincodeController'

const MASTER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] as const

export const mastersRouter = Router()

mastersRouter.get('/courier-company', requireAuth, requireRole([...MASTER_ROLES]), listCourierCompanies)
mastersRouter.post('/courier-company', requireAuth, requireRole([...MASTER_ROLES]), createCourierCompany)
mastersRouter.put('/courier-company/:id', requireAuth, requireRole([...MASTER_ROLES]), updateCourierCompany)
mastersRouter.delete('/courier-company/:id', requireAuth, requireRole([...MASTER_ROLES]), deleteCourierCompany)

mastersRouter.get('/pincode', requireAuth, requireRole([...MASTER_ROLES]), listPincodes)
mastersRouter.post('/pincode', requireAuth, requireRole([...MASTER_ROLES]), createPincode)
mastersRouter.put('/pincode/:id', requireAuth, requireRole([...MASTER_ROLES]), updatePincode)
mastersRouter.delete('/pincode/:id', requireAuth, requireRole([...MASTER_ROLES]), deletePincode)

