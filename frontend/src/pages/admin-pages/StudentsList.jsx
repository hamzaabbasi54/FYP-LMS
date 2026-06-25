import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdFileDownload, MdFileUpload, MdPersonAdd, MdClose, MdEmail, MdDelete, MdPerson, MdBadge, MdPhone, MdDescription, MdAdd } from 'react-icons/md';
import { studentApi } from '../../services/api';
import { toast } from 'react-toastify';
import OverlayLoader from '../../components/common/OverlayLoader';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import useUndoStore from '../../stores/useUndoStore';

const StudentList = () => {
    const queryClient = useQueryClient();
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newStudent, setNewStudent] = useState({
        firstName: '', lastName: '', email: '', roll_number: '', contact_number: '', cgpa: '',
        matric_marks: '', fsc_marks: '', background: '',
        parentName: '', parentEmail: '', parentPhone: ''
    });
    const [showImportModal, setShowImportModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data, isLoading: loading } = useQuery({
        queryKey: ['students', id, page, debouncedSearch],
        queryFn: async () => {
            const response = await studentApi.getAll({
                batch_id: id,
                page,
                limit,
                search: debouncedSearch
            });
            if (response.success) {
                return {
                    students: response.data || [],
                    pagination: response.pagination
                };
            }
            throw new Error('Failed to load students');
        },
        placeholderData: keepPreviousData
    });

    const students = data?.students || [];
    const pagination = data?.pagination || null;
    const visibleStudentIds = students.map((student) => student.id);
    const selectedVisibleCount = visibleStudentIds.filter((studentId) => selectedStudents.has(studentId)).length;
    const allVisibleSelected = visibleStudentIds.length > 0 && selectedVisibleCount === visibleStudentIds.length;
    const enqueueUndo = useUndoStore(s => s.enqueue);
    const isPendingUndo = useUndoStore(s => s.isPending);

    useEffect(() => {
        setSelectedStudents(new Set());
    }, [id, page, debouncedSearch]);

    const addStudentMutation = useMutation({
        mutationFn: (studentData) => studentApi.create(studentData),
        onSuccess: () => {
            toast.success('Student added successfully!');
            setShowAddModal(false);
            setNewStudent({ firstName: '', lastName: '', email: '', roll_number: '', contact_number: '', cgpa: '', matric_marks: '', fsc_marks: '', background: '', parentName: '', parentEmail: '', parentPhone: '' });
            queryClient.invalidateQueries({ queryKey: ['students', id] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add student');
        }
    });

    const handleAddStudent = (e) => {
        e.preventDefault();
        const payload = {
            first_name: newStudent.firstName,
            last_name: newStudent.lastName,
            email: newStudent.email,
            phone: newStudent.contact_number,
            student_id_number: newStudent.roll_number,
            cgpa: parseFloat(newStudent.cgpa) || 0,
            matric_marks: parseFloat(newStudent.matric_marks) || null,
            fsc_marks: parseFloat(newStudent.fsc_marks) || null,
            background: newStudent.background || null,
            batch_id: parseInt(id)
        };
        if (newStudent.parentName) {
            payload.parent = {
                name: newStudent.parentName,
                email: newStudent.parentEmail || null,
                phone: newStudent.parentPhone || null
            };
        }
        addStudentMutation.mutate(payload);
    };

    const handleImportClick = () => setShowImportModal(true);
    const triggerFileInput = () => {
        setShowImportModal(false);
        fileInputRef.current?.click();
    };

    const handleDownloadTemplate = async () => {
        try {
            await studentApi.downloadImportTemplate();
            toast.success('Template downloaded!');
        } catch (error) {
            console.error('Download template error:', error);
            const errMsg = error.response?.data?.message || error.message || 'Unknown error';
            toast.error(`Failed to download template: ${errMsg}`);
        }
    };

    const importMutation = useMutation({
        mutationFn: (file) => studentApi.import(id, file),
        onSuccess: (response) => {
            const imported = response.data?.imported || 0;
            const skipped = response.data?.skipped || 0;
            
            if (skipped > 0) {
                const firstError = response.data?.errors?.[0]?.error || 'Unknown error';
                toast.warn(`Imported ${imported} students. Skipped ${skipped}. First error: ${firstError}`);
            } else {
                toast.success(`Imported ${imported} students successfully!`);
            }
            queryClient.invalidateQueries({ queryKey: ['students', id] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to import students');
        },
        onSettled: () => {
            setIsImporting(false);
        }
    });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsImporting(true);
            importMutation.mutate(file);
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

    const getCgpaTone = (cgpa) => {
        const value = parseFloat(cgpa);
        if (value >= 3.5) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        if (value >= 3.0) return 'border-sky-200 bg-sky-50 text-sky-700';
        if (value >= 2.5) return 'border-amber-200 bg-amber-50 text-amber-700';
        return 'border-rose-200 bg-rose-50 text-rose-700';
    };

    const handleSelectAll = (e) => {
        e.stopPropagation();
        const shouldSelect = e.target.checked;
        setSelectedStudents((previous) => {
            const next = new Set(previous);
            visibleStudentIds.forEach((studentId) => {
                if (shouldSelect) {
                    next.add(studentId);
                } else {
                    next.delete(studentId);
                }
            });
            return next;
        });
    };

    const handleSelect = (e, studentId) => {
        e.stopPropagation(); // prevent row click
        setSelectedStudents((previous) => {
            const next = new Set(previous);
            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                next.add(studentId);
            }
            return next;
        });
    };

    const handleBulkDelete = () => {
        if (selectedStudents.size === 0) return;
        setShowDeleteModal(true);
    };

    const confirmBulkDelete = () => {
        if (selectedStudents.size === 0) return;
        const ids = Array.from(selectedStudents);
        const undoId = `students-bulk-${Date.now()}-${ids.join('-').substring(0, 30)}`;
        if (isPendingUndo(undoId)) return;

        queryClient.setQueryData(['students', id, page, debouncedSearch], (old) => {
            if (!old) return old;
            return {
                ...old,
                students: old.students.filter((student) => !ids.includes(student.id)),
                pagination: {
                    ...old.pagination,
                    total: Math.max(0, (old.pagination?.total || old.students.length) - ids.length)
                }
            };
        });

        enqueueUndo({
            id: undoId,
            type: 'Students',
            label: `${ids.length} student(s)`,
            highRisk: true,
            apiCall: async () => {
                const response = await studentApi.bulkDelete(ids, { confirm: true });
                queryClient.invalidateQueries({ queryKey: ['students', id] });
                queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                toast.success(response?.message || `${ids.length} student(s) deleted successfully`);
            },
            onUndo: () => {
                queryClient.invalidateQueries({ queryKey: ['students', id] });
                toast.info(`Deletion of ${ids.length} student(s) undone`);
            }
        });

        setSelectedStudents(new Set());
        setShowDeleteModal(false);
    };

    const cancelBulkDelete = () => {
        setShowDeleteModal(false);
    };

    const deleting = false;

    return (
        <div className="campus-detail-page min-h-full bg-gradient-to-br from-slate-100 to-slate-200">
            <OverlayLoader isLoading={isImporting} text="Importing students to batch..." />
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
                            <button type="button" onClick={handleBulkDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-100 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
                                <MdDelete className="w-5 h-5" /> {deleting ? 'Deleting...' : `Delete (${selectedStudents.size})`}
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />
                        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-full bg-[#0078c5] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(7,152,231,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#05629f]">
                            <MdAdd className="w-5 h-5" />
                            Add
                        </button>
                        <button onClick={handleImportClick} className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-sky-50">
                            <MdFileUpload className="w-5 h-5" />
                            Import
                        </button>
                        <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700">
                            <MdFileDownload className="w-5 h-5" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder="Search by name, ID, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-sky-100 shadow-sm rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all" />
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white/95 rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-4 px-6 w-12 text-left">
                                            <div className="flex items-center h-full">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={allVisibleSelected}
                                                disabled={students.length === 0 || deleting}
                                                onChange={handleSelectAll}
                                                onClick={(event) => event.stopPropagation()}
                                                aria-label="Select all visible students"
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
                                        <tr key={student.id} onClick={() => navigate(`/admin-managebatches/${id}/students/${student.id}`)} className="hover:bg-sky-50/45 transition-colors cursor-pointer group">
                                            <td className="py-4 px-6 w-12" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center h-full">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        checked={selectedStudents.has(student.id)}
                                                        disabled={deleting}
                                                        onChange={(e) => handleSelect(e, student.id)}
                                                        onClick={(event) => event.stopPropagation()}
                                                        aria-label={`Select ${student.first_name} ${student.last_name}`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl border border-sky-100 bg-sky-50 flex items-center justify-center shadow-sm">
                                                        <span className="text-sky-700 font-bold text-sm">
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
                                                <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-lg text-sm font-mono">{student.student_id_number || student.roll_number || 'N/A'}</span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-500">{student.phone || student.contact_number || 'N/A'}</td>
                                            <td className="py-4 px-6">
                                                {student.cgpa != null ? (
                                                    <span className={`inline-flex min-w-14 justify-center px-3 py-1 rounded-xl border text-sm font-bold ${getCgpaTone(student.cgpa)}`}>
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
                                    className="cf-action-secondary px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-slate-600 font-medium px-2">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={!pagination.hasNext}
                                    className="cf-action-secondary px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {showDeleteModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md overflow-hidden rounded-[1.35rem] border border-rose-100 bg-white shadow-[0_30px_90px_rgba(15,82,127,0.24)]">
                            <div className="flex items-start justify-between border-b border-sky-100 bg-[#eff8ff] p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
                                        <MdDelete className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Delete selected students?</h3>
                                        <p className="mt-1 text-sm font-medium text-slate-500">
                                            {selectedStudents.size} student(s) will be removed from this batch.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={cancelBulkDelete}
                                    className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                                    aria-label="Close delete confirmation"
                                >
                                    <MdClose className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                                    <p className="text-sm font-semibold text-slate-800">Undo will be available for 10 seconds.</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        After you confirm, the students will disappear from this list. Use the undo message if this was a mistake.
                                    </p>
                                </div>
                                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={cancelBulkDelete}
                                        className="rounded-full border border-sky-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-sky-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmBulkDelete}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(225,29,72,0.20)] transition hover:bg-rose-700"
                                    >
                                        <MdDelete className="h-5 w-5" />
                                        Delete students
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Student Modal — Faculty-style layout */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        <div className="w-full max-w-3xl mx-4 overflow-hidden flex flex-col rounded-[1.35rem] border border-sky-100 bg-white shadow-[0_30px_90px_rgba(15,82,127,0.22)]" style={{ maxHeight: '90vh' }}>
                            <div className="flex items-center justify-between p-5 border-b border-sky-100 bg-white flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
                                        <MdPersonAdd className="h-5 w-5" />
                                    </div>
                                    <div>
                                    <h3 className="text-lg font-bold text-slate-800">Register New Student</h3>
                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Fill in the details below to add a student to this batch</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors">
                                    <MdClose className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddStudent} className="overflow-y-auto flex-1 bg-[#eff8ff] p-5">
                                {/* Student Information Section */}
                                <div className="mb-5 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-5">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                            <MdPerson className="w-5 h-5" />
                                        </span>
                                        <h2 className="text-base font-bold text-slate-800">Student Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* First Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                                            <input type="text" required value={newStudent.firstName} onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                                                placeholder="e.g. Sara"
                                                className="w-full px-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Last Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                                            <input type="text" required value={newStudent.lastName} onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                                                placeholder="e.g. Malik"
                                                className="w-full px-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Roll Number */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Roll Number</label>
                                            <div className="relative">
                                                <MdBadge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <input type="text" required value={newStudent.roll_number} onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                                                    placeholder="e.g. 04162213027"
                                                    className="w-full pl-10 pr-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                            </div>
                                        </div>

                                        {/* Phone Number */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <div className="relative">
                                                <MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <input type="tel" value={newStudent.contact_number} onChange={(e) => setNewStudent({ ...newStudent, contact_number: e.target.value })}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="w-full pl-10 pr-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                            </div>
                                        </div>

                                        {/* University Email */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">University Email Address</label>
                                            <div className="relative">
                                                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <input type="email" required value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                                    placeholder="sara.malik@university.edu"
                                                    className="w-full pl-10 pr-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1.5 font-medium">Must be a valid .edu email address</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Information Section */}
                                <div className="mb-5 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-5">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                            <MdDescription className="w-5 h-5" />
                                        </span>
                                        <h2 className="text-base font-bold text-slate-800">Additional Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Parent Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Parent Name <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="text" value={newStudent.parentName} onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                                                placeholder="Parent's full name"
                                                className="w-full px-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Parent Phone */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Parent Phone <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="tel" value={newStudent.parentPhone} onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                                                placeholder="+1 (555) 000-0000"
                                                className="w-full px-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Parent Email */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Parent Email <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="email" value={newStudent.parentEmail} onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                                                placeholder="parent@example.com"
                                                className="w-full px-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* CGPA */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">CGPA <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="number" step="0.01" min="0" max="4" value={newStudent.cgpa} onChange={(e) => setNewStudent({ ...newStudent, cgpa: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full px-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Matric Marks */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Matric Marks <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="number" value={newStudent.matric_marks} onChange={(e) => setNewStudent({ ...newStudent, matric_marks: e.target.value })}
                                                placeholder="e.g. 950"
                                                className="w-full px-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* FSc Marks */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">FSc Marks <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="number" value={newStudent.fsc_marks} onChange={(e) => setNewStudent({ ...newStudent, fsc_marks: e.target.value })}
                                                placeholder="e.g. 900"
                                                className="w-full px-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Academic Background */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Academic Background <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <select value={newStudent.background} onChange={(e) => setNewStudent({ ...newStudent, background: e.target.value })}
                                                className="w-full px-4 py-3 border border-sky-100 bg-sky-50/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 text-sm font-medium text-slate-800">
                                                <option value="">Select background...</option>
                                                <option value="pre-med">Pre-Medical</option>
                                                <option value="pre-engineering">Pre-Engineering</option>
                                                <option value="ics">ICS</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-sky-100 bg-white/95 p-4 backdrop-blur">
                                    <button type="button" onClick={() => setShowAddModal(false)}
                                        className="px-6 py-3 border border-sky-100 bg-white text-slate-700 rounded-full hover:bg-sky-50 font-semibold text-sm transition-colors shadow-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={addStudentMutation.isPending}
                                        className="px-6 py-3 bg-[#0078c5] text-white rounded-full hover:bg-[#05629f] font-semibold text-sm transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_14px_30px_rgba(7,152,231,0.20)]">
                                        {addStudentMutation.isPending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <MdAdd className="w-5 h-5 mr-1.5" />
                                                Add Student
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
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
                                
                                <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm p-4 mb-4">
                                    <ul className="text-sm text-slate-600 space-y-2 font-mono">
                                        <li><span className="font-bold text-emerald-600">roll_number</span> (Required, Unique)</li>
                                        <li><span className="font-bold text-emerald-600">first_name</span> (Required)</li>
                                        <li><span className="font-bold text-emerald-600">last_name</span> (Required)</li>
                                        <li><span className="font-bold text-emerald-600">email</span> (Required)</li>
                                        <li><span className="text-slate-500">phone</span> (Optional)</li>
                                        <li><span className="text-slate-500">parent_name</span> (Optional)</li>
                                        <li><span className="text-slate-500">parent_email</span> (Optional)</li>
                                        <li><span className="text-slate-500">parent_phone</span> (Optional)</li>
                                        <li><span className="text-slate-500">matric_marks</span> (Optional, Number)</li>
                                        <li><span className="text-slate-500">fsc_marks</span> (Optional, Number)</li>
                                        <li><span className="text-slate-500">background</span> (Optional: 'pre-med', 'pre-engineering', or 'ics')</li>
                                    </ul>
                                </div>

                                {/* Download Template Button */}
                                <button onClick={handleDownloadTemplate} type="button"
                                    className="w-full mb-6 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 rounded-xl hover:from-blue-100 hover:to-indigo-100 font-semibold text-sm transition-all flex items-center justify-center gap-2">
                                    <MdFileDownload className="w-5 h-5" /> Download Excel Template
                                </button>

                                <div className="flex gap-3">
                                    <button onClick={() => setShowImportModal(false)} className="flex-1 px-4 py-2.5 border-2 border-slate-300 shadow-sm text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Cancel</button>
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
