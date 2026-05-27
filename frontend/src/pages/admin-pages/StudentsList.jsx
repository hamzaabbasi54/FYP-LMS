import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdFileDownload, MdFileUpload, MdPersonAdd, MdClose, MdEmail, MdDelete } from 'react-icons/md';
import { studentApi } from '../../services/api';
import { toast } from 'react-toastify';

const StudentList = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStudent, setNewStudent] = useState({
        name: '', email: '', roll_number: '', contact_number: '', cgpa: '',
        matric_marks: '', fsc_marks: '', background: ''
    });
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [deleting, setDeleting] = useState(false);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchStudents();
    }, [id, page, debouncedSearch]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await studentApi.getAll({ 
                batch_id: id,
                page,
                limit,
                search: debouncedSearch
            });
            if (response.success) {
                setStudents(response.data || []);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        const nameParts = newStudent.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Doe';
        try {
            const response = await studentApi.create({
                first_name: firstName,
                last_name: lastName,
                email: newStudent.email,
                phone: newStudent.contact_number,
                cgpa: parseFloat(newStudent.cgpa) || 0,
                matric_marks: parseFloat(newStudent.matric_marks) || null,
                fsc_marks: parseFloat(newStudent.fsc_marks) || null,
                background: newStudent.background || null,
                batch_id: parseInt(id)
            });
            if (response.success) {
                toast.success('Student added successfully!');
                setShowAddModal(false);
                setNewStudent({ name: '', email: '', roll_number: '', contact_number: '', cgpa: '', matric_marks: '', fsc_marks: '', background: '' });
                fetchStudents();
            }
        } catch (error) {
            console.error('Error adding student:', error);
            toast.error(error.response?.data?.message || 'Failed to add student');
        }
    };

    const handleImportClick = () => setShowImportModal(true);
    const triggerFileInput = () => {
        setShowImportModal(false);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const response = await studentApi.import(id, file);
                if (response.success) {
                    const imported = response.data?.imported || 0;
                    const skipped = response.data?.skipped || 0;
                    
                    if (skipped > 0) {
                        const firstError = response.data?.errors?.[0]?.error || 'Unknown error';
                        toast.warn(`Imported ${imported} students. Skipped ${skipped}. First error: ${firstError}`);
                    } else {
                        toast.success(`Imported ${imported} students successfully!`);
                    }
                    fetchStudents();
                }
            } catch (error) {
                console.error('Import error:', error);
                toast.error(error.response?.data?.message || 'Failed to import students');
            }
        }
        e.target.value = '';
    };

    const handleExport = async () => {
        try {
            const blob = await studentApi.export(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_batch_${id}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Export downloaded successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export students');
        }
    };

    const getCgpaColor = (cgpa) => {
        const value = parseFloat(cgpa);
        if (value >= 3.5) return 'from-emerald-500 to-teal-600';
        if (value >= 3.0) return 'from-blue-500 to-indigo-600';
        if (value >= 2.5) return 'from-amber-500 to-orange-600';
        return 'from-red-500 to-rose-600';
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = students.map(s => s.id);
            setSelectedStudents(new Set(allIds));
        } else {
            setSelectedStudents(new Set());
        }
    };

    const handleSelect = (e, id) => {
        e.stopPropagation(); // prevent row click
        const newSet = new Set(selectedStudents);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedStudents(newSet);
    };

    const handleBulkDelete = async () => {
        if (selectedStudents.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedStudents.size} students? This cannot be undone.`)) return;

        setDeleting(true);
        try {
            const ids = Array.from(selectedStudents);
            const response = await studentApi.bulkDelete(ids);
            if (response.success) {
                toast.success(response.message || 'Students deleted successfully');
                setSelectedStudents(new Set());
                fetchStudents();
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete students');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <Link to={`/admin-managebatches/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Batch Details
                    </Link>
                </div>

                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Students</h1>
                        </div>
                        <p className="text-slate-500 ml-5 mt-1">
                            {loading ? 'Loading...' : `${students.length} students enrolled`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {selectedStudents.size > 0 && (
                            <button onClick={handleBulkDelete} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all disabled:opacity-50">
                                <MdDelete className="w-5 h-5" /> {deleting ? 'Deleting...' : `Delete (${selectedStudents.size})`}
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />
                        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                            <MdPersonAdd className="w-5 h-5" /> Add
                        </button>
                        <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all">
                            <MdFileUpload className="w-5 h-5 text-emerald-500" /> Import
                        </button>
                        <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all">
                            <MdFileDownload className="w-5 h-5 text-blue-500" /> Export
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder="Search by name, ID, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-4 px-6 w-12 text-left">
                                            <div className="flex items-center h-full">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={students.length > 0 && selectedStudents.size === students.length}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Student</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Roll No.</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Contact</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">CGPA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="py-12 text-center text-slate-400">Loading students...</td></tr>
                                ) : students.length === 0 ? (
                                    <tr><td colSpan="5" className="py-12 text-center text-slate-400">{searchQuery ? 'No students match your search' : 'No students enrolled yet'}</td></tr>
                                ) : (
                                    students.map((student) => (
                                        <tr key={student.id} onClick={() => navigate(`/admin-managebatches/${id}/students/${student.id}`)} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                            <td className="py-4 px-6 w-12" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center h-full">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        checked={selectedStudents.has(student.id)}
                                                        onChange={(e) => handleSelect(e, student.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                                        <span className="text-slate-600 font-bold text-sm">
                                                            {(student.first_name || '?')[0]}{(student.last_name || '?')[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{student.first_name} {student.last_name}</p>
                                                        <p className="text-xs text-slate-400">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-mono">{student.student_id_number || student.roll_number || 'N/A'}</span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-500">{student.phone || student.contact_number || 'N/A'}</td>
                                            <td className="py-4 px-6">
                                                {student.cgpa != null ? (
                                                    <span className={`px-3 py-1 rounded-lg text-white text-sm font-bold bg-gradient-to-r ${getCgpaColor(student.cgpa)}`}>
                                                        {parseFloat(student.cgpa).toFixed(2)}
                                                    </span>
                                                ) : <span className="text-slate-400 text-sm">N/A</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            {selectedStudents.size > 0 
                                ? `${selectedStudents.size} selected`
                                : (pagination ? `Showing ${students.length} of ${pagination.total} students` : `Showing ${students.length} students`)
                            }
                        </p>
                        
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPrev}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-slate-600 font-medium px-2">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={!pagination.hasNext}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <h3 className="text-lg font-bold text-slate-800">Add New Student</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <MdClose className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddStudent} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                    <input type="text" required value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Enter name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                    <input type="email" required value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="student@university.edu" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Roll Number</label>
                                    <input type="text" required value={newStudent.roll_number} onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="U2024XXX" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact</label>
                                        <input type="tel" value={newStudent.contact_number} onChange={(e) => setNewStudent({ ...newStudent, contact_number: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="+1 XXX-XXX" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">CGPA</label>
                                        <input type="number" step="0.01" min="0" max="4" value={newStudent.cgpa} onChange={(e) => setNewStudent({ ...newStudent, cgpa: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Matric Marks</label>
                                        <input type="number" value={newStudent.matric_marks} onChange={(e) => setNewStudent({ ...newStudent, matric_marks: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. 850" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">FSc Marks</label>
                                        <input type="number" value={newStudent.fsc_marks} onChange={(e) => setNewStudent({ ...newStudent, fsc_marks: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. 920" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Background</label>
                                        <select value={newStudent.background} onChange={(e) => setNewStudent({ ...newStudent, background: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                                            <option value="">Select...</option>
                                            <option value="pre-med">Pre-Med</option>
                                            <option value="pre-engineering">Pre-Engineering</option>
                                            <option value="ics">ICS</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium">Add Student</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <MdFileUpload className="w-5 h-5 text-emerald-500" /> Import Students
                                </h3>
                                <button onClick={() => setShowImportModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <MdClose className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <h4 className="font-semibold text-slate-800 mb-2">Excel File Format Requirements</h4>
                                <p className="text-sm text-slate-600 mb-4">Please ensure your Excel file (.xlsx or .csv) contains the following column headers exactly as shown:</p>
                                
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                                    <ul className="text-sm text-slate-600 space-y-2 font-mono">
                                        <li><span className="font-bold text-emerald-600">first_name</span> (Required)</li>
                                        <li><span className="font-bold text-emerald-600">last_name</span> (Required)</li>
                                        <li><span className="font-bold text-emerald-600">email</span> (Required, Unique)</li>
                                        <li><span className="text-slate-500">phone</span> (Optional)</li>
                                        <li><span className="text-slate-500">parent_name</span> (Optional)</li>
                                        <li><span className="text-slate-500">parent_email</span> (Optional)</li>
                                        <li><span className="text-slate-500">parent_phone</span> (Optional)</li>
                                        <li><span className="text-slate-500">matric_marks</span> (Optional, Number)</li>
                                        <li><span className="text-slate-500">fsc_marks</span> (Optional, Number)</li>
                                        <li><span className="text-slate-500">background</span> (Optional: 'pre-med', 'pre-engineering', or 'ics')</li>
                                    </ul>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setShowImportModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Cancel</button>
                                    <button onClick={triggerFileInput} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg font-medium flex items-center justify-center gap-2">
                                        <MdFileUpload className="w-5 h-5" /> Select File
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentList;
