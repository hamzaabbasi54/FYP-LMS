import React, { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdFileDownload, MdFileUpload, MdPersonAdd, MdClose } from 'react-icons/md';

const StudentList = () => {
    const { id } = useParams();
    const fileInputRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newStudent, setNewStudent] = useState({
        name: '',
        email: '',
        studentId: '',
        contact: '',
        cgpa: ''
    });

    const handleAddStudent = (e) => {
        e.preventDefault();
        // TODO: Implement add student API call
        console.log('Adding student:', newStudent);
        alert(`Student "${newStudent.name}" added successfully!`);
        setShowAddModal(false);
        setNewStudent({ name: '', email: '', studentId: '', contact: '', cgpa: '' });
    };

    // Mock Data
    const students = [
        { id: 'U2024001', name: 'Alice Johnson', email: 'alice.j@university.edu', contact: '+1 123-456-7890', cgpa: '3.85' },
        { id: 'U2024002', name: 'Bob Williams', email: 'bob.w@university.edu', contact: '+1 234-567-0981', cgpa: '3.50' },
        { id: 'U2024003', name: 'Charlie Brown', email: 'charlie.b@university.edu', contact: '+1 865-674-0012', cgpa: '3.02' },
        { id: 'U2024004', name: 'Diana Miller', email: 'diana.m@university.edu', contact: '+1 456-789-0123', cgpa: '3.71' },
        { id: 'U2024005', name: 'Ethan Davis', email: 'ethan.d@university.edu', contact: '+1 567-890-1234', cgpa: '2.64' },
        { id: 'U2024006', name: 'Fiona Garcia', email: 'fiona.g@university.edu', contact: '+1 678-901-2345', cgpa: '3.98' },
    ];

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // TODO: Implement Excel file parsing logic here
            console.log('Selected file:', file.name);
            alert(`File "${file.name}" selected. Excel import functionality will be implemented.`);
        }
        // Reset the input so the same file can be selected again
        e.target.value = '';
    };

    // Filter students based on search query
    const filteredStudents = students.filter((student) => {
        const query = searchQuery.toLowerCase();
        return (
            student.name.toLowerCase().includes(query) ||
            student.id.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query)
        );
    });

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">

            {/* Breadcrumb */}
            <div className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
                <Link to={`/admin-managebatches/${id}`} className="hover:text-blue-600 flex items-center">
                    <MdArrowBack className="mr-1" /> Back to Batch Details
                </Link>
                <span>/</span>
                <span className="text-gray-800 font-semibold">Students</span>
            </div>

            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Students in Computer Science 2024</h2>
                    <p className="text-sm text-gray-500 mt-1">A comprehensive list of all students enrolled in this batch.</p>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    {/* Search */}
                    <div className="relative w-full max-w-md">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or student ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Student ID</th>
                                <th className="px-6 py-4">Contact Number</th>
                                <th className="px-6 py-4 text-right">CGPA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{student.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{student.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{student.contact}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">{student.cgpa}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {searchQuery
                            ? <>Found <span className="font-bold text-gray-800">{filteredStudents.length}</span> results</>
                            : <>Showing <span className="font-bold text-gray-800">1 to {students.length}</span> of {students.length} results</>
                        }
                    </p>

                    <div className="flex items-center space-x-2">
                        <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">Next</button>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex justify-end gap-3">
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                />

                {/* Add Student Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 shadow-sm transition-colors text-sm font-medium"
                >
                    <MdPersonAdd className="w-5 h-5 mr-2" /> Add Student
                </button>

                {/* Import Excel Button */}
                <button
                    onClick={handleImportClick}
                    className="flex items-center bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 shadow-sm transition-colors text-sm font-medium"
                >
                    <MdFileUpload className="w-5 h-5 mr-2" /> Import from Excel
                </button>

                {/* Download Button */}
                <button className="flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium">
                    <MdFileDownload className="w-5 h-5 mr-2" /> Download List
                </button>
            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Add New Student</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddStudent} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newStudent.name}
                                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter student name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newStudent.email}
                                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="student@university.edu"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                                <input
                                    type="text"
                                    required
                                    value={newStudent.studentId}
                                    onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="U2024XXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input
                                    type="tel"
                                    value={newStudent.contact}
                                    onChange={(e) => setNewStudent({ ...newStudent, contact: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="+1 XXX-XXX-XXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CGPA (optional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="4"
                                    value={newStudent.cgpa}
                                    onChange={(e) => setNewStudent({ ...newStudent, cgpa: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00 - 4.00"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StudentList;
