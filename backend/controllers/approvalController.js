// ============================================
// File: backend/controllers/approvalController.js
// Approval Controller — MySQL Version
// ============================================

import pool from '../config/db.js';

// Get pending users based on the approver's role
export const getPendingUsers = async (req, res) => {
    try {
        const { role, faculty, department, faculty_id, department_id } = req.user;
        let query = '';
        let params = [];

        // Super Admin sees pending Deans
        if (role === 'superadmin') {
            query = `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status,
                            u.created_at, f.name as faculty_name
                     FROM users u
                     LEFT JOIN faculties f ON u.faculty_id = f.id
                     WHERE u.status = 'pending' AND u.role = 'dean'
                     ORDER BY u.created_at DESC`;
        }
        // Dean sees pending Department Admins in their faculty
        else if (role === 'dean') {
            query = `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status,
                            u.created_at, d.name as department_name, f.name as faculty_name
                     FROM users u
                     LEFT JOIN departments d ON u.department_id = d.id
                     LEFT JOIN faculties f ON u.faculty_id = f.id
                     WHERE u.status = 'pending' AND u.role = 'deptadmin' AND u.faculty_id = ?
                     ORDER BY u.created_at DESC`;
            params = [faculty_id];
        }
        // Department Admin sees pending Faculty in their department
        else if (role === 'deptadmin') {
            query = `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status,
                            u.created_at, d.name as department_name
                     FROM users u
                     LEFT JOIN departments d ON u.department_id = d.id
                     WHERE u.status = 'pending' AND u.role = 'faculty' AND u.department_id = ?
                     ORDER BY u.created_at DESC`;
            params = [department_id];
        }
        else {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view pending approvals'
            });
        }

        const [pendingUsers] = await pool.query(query, params);

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

// Approve a user
export const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const approver = req.user;

        // Get the user to approve
        const [users] = await pool.query(
            `SELECT u.*, f.name as faculty_name, d.name as department_name
             FROM users u
             LEFT JOIN faculties f ON u.faculty_id = f.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        if (user.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'User is not pending approval'
            });
        }

        // Verify approver has permission
        if (!verifyApprovalPermission(approver, user)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to approve this user'
            });
        }

        // Update user status
        const approvedById = approver.role === 'superadmin' ? approver.id : approver.id;
        await pool.query(
            'UPDATE users SET status = ?, approved_by = ? WHERE id = ?',
            ['approved', approvedById, userId]
        );

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
        res.status(500).json({
            success: false,
            message: 'Error approving user'
        });
    }
};

// Reject a user
export const rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const approver = req.user;

        const [users] = await pool.query(
            `SELECT u.*, f.name as faculty_name, d.name as department_name
             FROM users u
             LEFT JOIN faculties f ON u.faculty_id = f.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        if (user.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'User is not pending approval'
            });
        }

        if (!verifyApprovalPermission(approver, user)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to reject this user'
            });
        }

        await pool.query(
            'UPDATE users SET status = ?, rejection_reason = ? WHERE id = ?',
            ['rejected', reason || '', userId]
        );

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
        res.status(500).json({
            success: false,
            message: 'Error rejecting user'
        });
    }
};

// Get all users by role (for management)
export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const approver = req.user;

        let query = '';
        let params = [];

        if (approver.role === 'superadmin') {
            query = `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status,
                            u.is_active, u.created_at,
                            f.name as faculty_name, d.name as department_name
                     FROM users u
                     LEFT JOIN faculties f ON u.faculty_id = f.id
                     LEFT JOIN departments d ON u.department_id = d.id
                     WHERE u.role = ?
                     ORDER BY u.created_at DESC`;
            params = [role];
        }
        else if (approver.role === 'dean') {
            if (role === 'deptadmin' || role === 'faculty') {
                query = `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status,
                                u.is_active, u.created_at,
                                f.name as faculty_name, d.name as department_name
                         FROM users u
                         LEFT JOIN faculties f ON u.faculty_id = f.id
                         LEFT JOIN departments d ON u.department_id = d.id
                         WHERE u.role = ? AND u.faculty_id = ?
                         ORDER BY u.created_at DESC`;
                params = [role, approver.faculty_id];
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view deptadmin and faculty members'
                });
            }
        }
        else if (approver.role === 'deptadmin') {
            if (role === 'faculty') {
                query = `SELECT u.id, u.full_name, u.email, u.role, u.phone_number, u.status,
                                u.is_active, u.created_at,
                                d.name as department_name
                         FROM users u
                         LEFT JOIN departments d ON u.department_id = d.id
                         WHERE u.role = 'faculty' AND u.department_id = ?
                         ORDER BY u.created_at DESC`;
                params = [approver.department_id];
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view faculty members'
                });
            }
        }

        const [users] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};

// Delete a user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const approver = req.user;

        const [users] = await pool.query(
            `SELECT u.*, f.name as faculty_name, d.name as department_name
             FROM users u
             LEFT JOIN faculties f ON u.faculty_id = f.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        if (!verifyDeletePermission(approver, user)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this user'
            });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [userId]);

        res.status(200).json({
            success: true,
            message: `${user.full_name} has been deleted`
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

// Helper: verify approval permission
function verifyApprovalPermission(approver, user) {
    if (approver.role === 'superadmin' && user.role === 'dean') return true;
    if (approver.role === 'dean' && user.role === 'deptadmin' && approver.faculty_id === user.faculty_id) return true;
    if (approver.role === 'deptadmin' && user.role === 'faculty' && approver.department_id === user.department_id) return true;
    return false;
}

// Helper: verify delete permission
function verifyDeletePermission(approver, user) {
    if (approver.role === 'superadmin' && user.role === 'dean') return true;
    if (approver.role === 'dean' && user.role === 'deptadmin' && approver.faculty_id === user.faculty_id) return true;
    if (approver.role === 'deptadmin' && user.role === 'faculty' && approver.department_id === user.department_id) return true;
    return false;
}
