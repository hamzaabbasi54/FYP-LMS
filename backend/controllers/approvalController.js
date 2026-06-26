// ============================================
// File: backend/controllers/approvalController.js
// Approval Controller — 2-Role (deptadmin approves faculty)
// ============================================

import pool from '../config/db.js';
import { cacheGet, cacheSet, cacheDelPattern } from '../config/redis.js';

// Get pending faculty users (admin only)
export const getPendingUsers = async (req, res) => {
    try {
        const { role, department_id } = req.user;

        if (role !== 'deptadmin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view pending approvals'
            });
        }

        if (!department_id) {
            return res.status(400).json({ success: false, message: 'Missing approver department context' });
        }

        const [pendingUsers] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status,
                    u.created_at, d.name as department_name
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.status = 'pending' AND u.role = 'faculty'
             AND u.department_id = ?
             ORDER BY u.created_at DESC`,
            [department_id]
        );

        res.status(200).json({
            success: true,
            count: pendingUsers.length,
            data: pendingUsers
        });
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending users'
        });
    }
};

// Approve a faculty user
export const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const approver = req.user;

        if (approver.role !== 'deptadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only Department Admin can approve users'
            });
        }

        if (!approver.department_id) {
            return res.status(400).json({ success: false, message: 'Missing approver department context' });
        }

        const [result] = await pool.query(
            `UPDATE users 
             SET status = 'approved', approved_by = ? 
             WHERE id = ? AND status = 'pending' AND role = 'faculty' AND department_id = ?`,
            [approver.id, userId, approver.department_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'User not found, already processed, or access denied' });
        }

        const [users] = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = ?', [userId]);
        const user = users[0];

        await cacheDelPattern(`facultyUsers:${approver.department_id}`);
        await cacheDelPattern('dashboard:stats:*');

        res.status(200).json({
            success: true,
            message: `${user.full_name} has been approved`,
            data: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                status: 'approved'
            }
        });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ success: false, message: 'Error approving user' });
    }
};

// Reject a faculty user
export const rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const approver = req.user;

        if (approver.role !== 'deptadmin') {
            return res.status(403).json({ success: false, message: 'Only Department Admin can reject users' });
        }

        if (!approver.department_id) {
            return res.status(400).json({ success: false, message: 'Missing approver department context' });
        }

        const [result] = await pool.query(
            `UPDATE users 
             SET status = 'rejected', rejection_reason = ? 
             WHERE id = ? AND status = 'pending' AND role = 'faculty' AND department_id = ?`,
            [reason || '', userId, approver.department_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'User not found, already processed, or access denied' });
        }

        const [users] = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = ?', [userId]);
        const user = users[0];

        await cacheDelPattern(`facultyUsers:${approver.department_id}`);
        await cacheDelPattern('dashboard:stats:*');

        res.status(200).json({
            success: true,
            message: `${user.full_name} has been rejected`,
            data: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                status: 'rejected'
            }
        });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ success: false, message: 'Error rejecting user' });
    }
};

// Get all users by role (admin manages faculty list)
export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const approver = req.user;

        if (approver.role !== 'deptadmin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!approver.department_id) {
            return res.status(400).json({ success: false, message: 'Missing approver department context' });
        }

        // Admin can only view faculty members
        if (role !== 'faculty') {
            return res.status(403).json({ success: false, message: 'You can only view faculty members' });
        }

        const cacheKey = `facultyUsers:${approver.department_id}`;
        const cached = await cacheGet(cacheKey);
        if (cached) return res.json(cached);

        const [users] = await pool.query(
            `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status,
                    u.is_active, u.created_at, d.name as department_name
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.role = 'faculty' AND u.department_id = ?
             ORDER BY u.created_at DESC`,
            [approver.department_id]
        );

        const payload = {
            success: true,
            count: users.length,
            data: users
        };
        await cacheSet(cacheKey, payload, 2592000);
        res.status(200).json(payload);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
};

// Delete a faculty user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const approver = req.user;

        if (approver.role !== 'deptadmin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!approver.department_id) {
            return res.status(400).json({ success: false, message: 'Missing approver department context' });
        }

        const [result] = await pool.query(
            `DELETE FROM users WHERE id = ? AND role = 'faculty' AND department_id = ?`,
            [userId, approver.department_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found or access denied' });
        }

        await cacheDelPattern(`facultyUsers:${approver.department_id}`);

        res.status(200).json({
            success: true,
            message: `User has been deleted`
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
};
