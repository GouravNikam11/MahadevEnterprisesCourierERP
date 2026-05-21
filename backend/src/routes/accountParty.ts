import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import {
  createAccountParty,
  deleteAccountParty,
  getAccountParty,
  listAccountParties,
  updateAccountParty,
} from '../controllers/accountPartyController'

const MASTER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] as const

export const accountPartyRouter = Router()

/**
 * @openapi
 * /account-party:
 *   get:
 *     summary: List account parties (search + pagination)
 *     tags: [Account Party]
 *     security: [{ bearerAuth: [] }]
 */
accountPartyRouter.get('/account-party', requireAuth, requireRole([...MASTER_ROLES]), listAccountParties)

/**
 * @openapi
 * /account-party:
 *   post:
 *     summary: Create account party
 *     tags: [Account Party]
 *     security: [{ bearerAuth: [] }]
 */
accountPartyRouter.post('/account-party', requireAuth, requireRole([...MASTER_ROLES]), createAccountParty)

/**
 * @openapi
 * /account-party/{id}:
 *   get:
 *     summary: Get account party
 *     tags: [Account Party]
 *     security: [{ bearerAuth: [] }]
 */
accountPartyRouter.get('/account-party/:id', requireAuth, requireRole([...MASTER_ROLES]), getAccountParty)

/**
 * @openapi
 * /account-party/{id}:
 *   put:
 *     summary: Update account party
 *     tags: [Account Party]
 *     security: [{ bearerAuth: [] }]
 */
accountPartyRouter.put('/account-party/:id', requireAuth, requireRole([...MASTER_ROLES]), updateAccountParty)

/**
 * @openapi
 * /account-party/{id}:
 *   delete:
 *     summary: Soft delete account party
 *     tags: [Account Party]
 *     security: [{ bearerAuth: [] }]
 */
accountPartyRouter.delete('/account-party/:id', requireAuth, requireRole([...MASTER_ROLES]), deleteAccountParty)

