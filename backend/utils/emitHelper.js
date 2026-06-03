// ============================================
// File: backend/utils/emitHelper.js
// Reusable helper to emit events to department rooms
// ============================================

import { getIO } from './socket.js';

export const emitToDepartment = (departmentId, event, data) => {
    const io = getIO();
    if (io && departmentId) {
        io.to(`dept_${departmentId}`).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }
};
