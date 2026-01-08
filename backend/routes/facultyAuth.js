import express from 'express';
import { facultySignup, facultyLogin } from '../controllers/facultyController.js';

const router = express.Router();

// Faculty Signup Route
router.post('/signup', facultySignup);

// Faculty Login Route
router.post('/login', facultyLogin);

export default router;
