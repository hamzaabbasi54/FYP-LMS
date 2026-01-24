import User from '../models/User.js';

// Get pending users based on the approver's role
export const getPendingUsers = async (req, res) => {
    try {
        const { role, faculty, department } = req.user;
        let query = { status: 'pending' };

        // Super Admin sees pending Deans
        if (role === 'superadmin') {
            query.role = 'dean';
        }
        // Dean sees pending Department Admins in their faculty
        else if (role === 'dean') {
            query.role = 'deptadmin';
            query.faculty = faculty;
        }
        // Department Admin sees pending Faculty in their department
        else if (role === 'deptadmin') {
            query.role = 'faculty';
            query.department = department;
        }
        else {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view pending approvals'
            });
        }

        const pendingUsers = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

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

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'User is not pending approval'
            });
        }

        // Verify approver has permission
        const canApprove = verifyApprovalPermission(approver, user);
        if (!canApprove) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to approve this user'
            });
        }

        user.status = 'approved';
        user.approvedBy = approver.id === 'superadmin' ? null : approver.id;
        await user.save();

        res.status(200).json({
            success: true,
            message: `${user.fullName} has been approved`,
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                status: user.status
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

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'User is not pending approval'
            });
        }

        // Verify approver has permission
        const canApprove = verifyApprovalPermission(approver, user);
        if (!canApprove) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to reject this user'
            });
        }

        user.status = 'rejected';
        user.rejectionReason = reason || '';
        await user.save();

        res.status(200).json({
            success: true,
            message: `${user.fullName} has been rejected`,
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                status: user.status
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

        let query = { role };

        // Filter by faculty/department based on approver's permissions
        if (approver.role === 'dean') {
            if (role === 'deptadmin' || role === 'faculty') {
                query.faculty = approver.faculty;
            }
        } else if (approver.role === 'deptadmin') {
            if (role === 'faculty') {
                query.department = approver.department;
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view faculty members'
                });
            }
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

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

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify permission to delete
        const canDelete = verifyDeletePermission(approver, user);
        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this user'
            });
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: `${user.fullName} has been deleted`
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

// Helper function to verify approval permission
function verifyApprovalPermission(approver, user) {
    // Super Admin can approve Deans
    if (approver.role === 'superadmin' && user.role === 'dean') {
        return true;
    }
    // Dean can approve Department Admins in their faculty
    if (approver.role === 'dean' && user.role === 'deptadmin' && approver.faculty === user.faculty) {
        return true;
    }
    // Department Admin can approve Faculty in their department
    if (approver.role === 'deptadmin' && user.role === 'faculty' && approver.department === user.department) {
        return true;
    }
    return false;
}

// Helper function to verify delete permission
function verifyDeletePermission(approver, user) {
    // Super Admin can delete Deans
    if (approver.role === 'superadmin' && user.role === 'dean') {
        return true;
    }
    // Dean can delete Department Admins in their faculty
    if (approver.role === 'dean' && user.role === 'deptadmin' && approver.faculty === user.faculty) {
        return true;
    }
    // Department Admin can delete Faculty in their department
    if (approver.role === 'deptadmin' && user.role === 'faculty' && approver.department === user.department) {
        return true;
    }
    return false;
}
