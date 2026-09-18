import { Router } from 'express'
import {
  listWorldsAdmin, getWorldAdmin, createWorldAdmin, updateWorldAdmin, deleteWorldAdmin,
  listLocationsAdmin, getLocationAdmin, createLocationAdmin, updateLocationAdmin, deleteLocationAdmin,
  listChallengesAdmin, getChallengeAdmin, createChallengeAdmin, updateChallengeAdmin, deleteChallengeAdmin,
  listCollectiblesAdmin, getCollectibleAdmin, createCollectibleAdmin, updateCollectibleAdmin, deleteCollectibleAdmin,
  listCharactersAdmin, getCharacterAdmin, createCharacterAdmin, updateCharacterAdmin, deleteCharacterAdmin,
  getAdventureAnalytics,
} from '../controllers/adminAdventureController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth) // must be logged in as an admin to use any route below

const readRoles = requireRole('superadmin', 'editor', 'analyst')
const writeRoles = requireRole('superadmin', 'editor')

router.get('/worlds', readRoles, listWorldsAdmin)
router.get('/worlds/:id', readRoles, getWorldAdmin)
router.post('/worlds', writeRoles, createWorldAdmin)
router.put('/worlds/:id', writeRoles, updateWorldAdmin)
router.delete('/worlds/:id', writeRoles, deleteWorldAdmin)

router.get('/locations', readRoles, listLocationsAdmin)
router.get('/locations/:id', readRoles, getLocationAdmin)
router.post('/locations', writeRoles, createLocationAdmin)
router.put('/locations/:id', writeRoles, updateLocationAdmin)
router.delete('/locations/:id', writeRoles, deleteLocationAdmin)

router.get('/challenges', readRoles, listChallengesAdmin)
router.get('/challenges/:id', readRoles, getChallengeAdmin)
router.post('/challenges', writeRoles, createChallengeAdmin)
router.put('/challenges/:id', writeRoles, updateChallengeAdmin)
router.delete('/challenges/:id', writeRoles, deleteChallengeAdmin)

router.get('/collectibles', readRoles, listCollectiblesAdmin)
router.get('/collectibles/:id', readRoles, getCollectibleAdmin)
router.post('/collectibles', writeRoles, createCollectibleAdmin)
router.put('/collectibles/:id', writeRoles, updateCollectibleAdmin)
router.delete('/collectibles/:id', writeRoles, deleteCollectibleAdmin)

router.get('/characters', readRoles, listCharactersAdmin)
router.get('/characters/:id', readRoles, getCharacterAdmin)
router.post('/characters', writeRoles, createCharacterAdmin)
router.put('/characters/:id', writeRoles, updateCharacterAdmin)
router.delete('/characters/:id', writeRoles, deleteCharacterAdmin)

router.get('/analytics', readRoles, getAdventureAnalytics) // world unlock / challenge completion stats — see engagementRoutes.js for the separate "opens"/"most-visited" tracking

export default router
