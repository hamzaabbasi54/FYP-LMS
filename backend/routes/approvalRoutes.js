import express from 'express';
import {
    getPendingUsers,
    approveUser,
    rejectUser,
    getUsersByRole,
    deleteUser
} from '../controllers/approvalController.js';
import { verifyToken, canApprove } from '../middleware/auth.js';

const router = express.Router();

// All approval routes require authentication and approval permission
router.use(verifyToken, canApprove);

// Get pending users (based on approver's role)
router.get('/pending', getPendingUsers);

// Approve a user
router.post('/:userId/approve', approveUser);

// Reject a user
router.post('/:userId/reject', rejectUser);

// Get users by role
router.get('/users/:role', getUsersByRole);

// Delete a user
router.delete('/:userId', deleteUser);

export default router;
