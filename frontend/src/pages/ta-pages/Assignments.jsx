import React from 'react';

const TAAssignment = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Assignment Tasks</h1>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600">Manage assignment uploads and checks delegated by the course instructor.</p>
                <div className="mt-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-64 bg-gray-50">
                    <p className="text-gray-500 font-medium">No active assignment tasks assigned by faculty.</p>
                </div>
            </div>
        </div>
    );
};

export default TAAssignment;
