import { Router } from 'express';
import {
  getAllPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson
} from '../controllers/peopleController';

const router = Router();

// GET /api/people?role=player|trainer
router.get('/', getAllPeople);

// GET /api/people/:id
router.get('/:id', getPersonById);

// POST /api/people
router.post('/', createPerson);

// PUT /api/people/:id
router.put('/:id', updatePerson);

// DELETE /api/people/:id
router.delete('/:id', deletePerson);

export default router;