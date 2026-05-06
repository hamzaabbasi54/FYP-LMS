import React from 'react';

const GradingSupport = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Grading Assistance</h1>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-600">Select a course to view pending assignments and quizzes for grading.</p>
                {/* Mock List */}
                <div className="mt-8 grid gap-4 max-w-2xl mx-auto text-left">
                    <div className="p-4 border rounded hover:shadow-md cursor-pointer transition-shadow bg-gray-50">
                        <h3 className="font-bold text-sky-700">CS-101: Intro to Programming</h3>
                        <p className="text-sm text-gray-600">35 Assignments Pending</p>
                    </div>
                    <div className="p-4 border rounded hover:shadow-md cursor-pointer transition-shadow bg-gray-50">
                        <h3 className="font-bold text-sky-700">CS-202: Data Structures</h3>
                        <p className="text-sm text-gray-600">12 Quizzes Pending</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradingSupport;
