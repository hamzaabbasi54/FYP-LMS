import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdFileDownload, MdFileUpload, MdPersonAdd, MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';
import { studentApi } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

const StudentList = () => {
    const { id: batchId } = useParams();
    const fileInputRef = useRef(null);
    
    // UI States
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    
    // Data States
    const [students, setStudents] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const [newStudent, setNewStudent] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    });

    // Fetch Students on load, page change, or search change
    useEffect(() => {
        fetchStudents();
    }, [pagination.page, debouncedSearch, batchId]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await studentApi.getStudents(pagination.page, pagination.limit, debouncedSearch, batchId);
            if (response.success) {
                setStudents(response.data);
                setPagination(response.pagination);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const data = { ...newStudent, batch_id: batchId };
            await studentApi.addStudent(data);
            toast.success(`Student "${newStudent.first_name}" added successfully!`);
            setShowAddModal(false);
            setNewStudent({ first_name: '', last_name: '', email: '', phone: '' });
            fetchStudents();
        } catch (error) {
            toast.error(error.message || 'Failed to add student');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setImporting(true);
            toast.info('Importing students...');
            const response = await studentApi.importStudents(file);
            
            if (response.success) {
                toast.success(`Import complete! Saved: ${response.data.imported}, Skipped: ${response.data.skipped}`);
                fetchStudents();
                
                // Show errors if any
                if (response.data.errors?.length > 0) {
                    console.warn('Import errors:', response.data.errors);
                    toast.warning(`${response.data.errors.length} rows had errors. Check console for details.`);
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to import students');
        } finally {
            setImporting(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleExportClick = async () => {
        try {
            setExporting(true);
            toast.info('Generating Excel file...');
            
            const blob = await studentApi.exportStudents(batchId);
            
            // Create a temporary link to trigger download
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `students_batch_${batchId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Download started!');
        } catch (error) {
            toast.error('Failed to export students. Ensure there is data to export.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">

            {/* Breadcrumb */}
            <div className="mb-6 flex items-center space-x-2 text-sm text-gray-500">
                <Link to={`/admin-managebatches/${batchId}`} className="hover:text-blue-600 flex items-center">
                    <MdArrowBack className="mr-1" /> Back to Batch Details
                </Link>
                <span>/</span>
                <span className="text-gray-800 font-semibold">Students</span>
            </div>

            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Students in Batch</h2>
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
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[300px]">
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
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading students...</td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No students found.</td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">{student.first_name} {student.last_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{student.student_id_number}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{student.phone || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">{student.cgpa || '0.00'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-bold text-gray-800">
                            {students.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} 
                            to {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span> of <span className="font-bold">{pagination.total}</span> results
                    </p>

                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={!pagination.hasPrev}
                            className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600 px-2">Page {pagination.page} of {pagination.totalPages || 1}</span>
                        <button 
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={!pagination.hasNext}
                            className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
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
                    disabled={importing}
                    className="flex items-center bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 shadow-sm transition-colors text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <MdFileUpload className="w-5 h-5 mr-2" /> {importing ? 'Importing...' : 'Import from Excel'}
                </button>

                {/* Download Button */}
                <button 
                    onClick={handleExportClick}
                    disabled={exporting}
                    className="flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <MdFileDownload className="w-5 h-5 mr-2" /> {exporting ? 'Exporting...' : 'Download List'}
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudent.first_name}
                                        onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudent.last_name}
                                        onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input
                                    type="tel"
                                    value={newStudent.phone}
                                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="+1 XXX-XXX-XXXX"
                                />
                            </div>
                            
                            {/* Note: Student ID is auto-generated by the backend */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-700">
                                    <span className="font-semibold">Note:</span> Student ID (e.g. U2024001) will be automatically generated upon creation.
                                </p>
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
