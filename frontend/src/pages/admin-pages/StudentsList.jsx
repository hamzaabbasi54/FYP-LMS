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
    const [importReport, setImportReport] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [isProcessingDeleteAll, setIsProcessingDeleteAll] = useState(false);
    const [activeDataWarning, setActiveDataWarning] = useState(null);
    const [pendingDeleteAction, setPendingDeleteAction] = useState(null);

    // Pagination & Search
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data, isLoading: loading, isFetching } = useQuery({
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
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // Cache on frontend for 5 minutes
    });

    const students = data?.students || [];
    const pagination = data?.pagination || null;

    const addStudentMutation = useMutation({
        mutationFn: (studentData) => studentApi.create(studentData),
        onSuccess: () => {
            toast.success('Student added successfully!');
            setShowAddModal(false);
            setNewStudent({ firstName: '', lastName: '', email: '', roll_number: '', contact_number: '', cgpa: '', matric_marks: '', fsc_marks: '', background: '', parentName: '', parentEmail: '', parentPhone: '' });
            queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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

            if (skipped > 0 || response.data?.errors?.length > 0) {
                setImportReport(response.data);
            } else {
                toast.success(`Imported ${imported} students successfully!`);
            }
            queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        },
        onError: (error) => {
            if (error.response?.status === 400 && error.response?.data?.data?.errors) {
                setImportReport(error.response.data.data);
            } else {
                toast.error(error.response?.data?.message || 'Failed to import students');
            }
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

    const enqueueUndo = useUndoStore(s => s.enqueue);
    const isPendingUndo = useUndoStore(s => s.isPending);

    const handleBulkDelete = async () => {
        if (selectedStudents.size === 0) return;
        const ids = Array.from(selectedStudents);
        const undoId = `students-bulk-${ids.join('-').substring(0, 30)}`;

        // Pre-flight: check for active data via deleteGuard
        try {
            const guardRes = await studentApi.bulkDelete(ids);
            if (guardRes.requiresConfirmation && guardRes.hasActiveData) {
                setActiveDataWarning(guardRes.message);
                setPendingDeleteAction(() => () => {
                    // Optimistically remove from cache
                    queryClient.setQueryData(['students', id, page, debouncedSearch], (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            students: old.students.filter(s => !selectedStudents.has(s.id)),
                            pagination: { ...old.pagination, total: (old.pagination?.total || ids.length) - ids.length }
                        };
                    });
                    setSelectedStudents(new Set());
                    enqueueUndo({
                        id: undoId,
                        type: 'Students',
                        label: `${ids.length} student(s)`,
                        highRisk: true,
                        apiCall: async () => {
                            await studentApi.bulkDelete(ids, { confirm: true });
                            queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                            toast.success(`${ids.length} student(s) deleted`);
                        },
                        onUndo: () => {
                            queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                            toast.info(`Deletion of ${ids.length} student(s) undone`);
                        }
                    });
                });
                return;
            }
        } catch { /* proceed */ }

        // Optimistically remove from cache
        queryClient.setQueryData(['students', id, page, debouncedSearch], (old) => {
            if (!old) return old;
            return {
                ...old,
                students: old.students.filter(s => !selectedStudents.has(s.id)),
                pagination: { ...old.pagination, total: (old.pagination?.total || ids.length) - ids.length }
            };
        });
        setSelectedStudents(new Set());

        enqueueUndo({
            id: undoId,
            type: 'Students',
            label: `${ids.length} student(s)`,
            highRisk: true,
            apiCall: async () => {
                await studentApi.bulkDelete(ids, { confirm: true });
                queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                toast.success(`${ids.length} student(s) deleted`);
            },
            onUndo: () => {
                queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                toast.info(`Deletion of ${ids.length} student(s) undone`);
            }
        });
    };

    const handleDeleteAll = () => {
        setShowDeleteAllModal(true);
    };

    const executeDeleteAll = async () => {
        setIsProcessingDeleteAll(true);
        try {
            const res = await studentApi.getAllIds(id);
            if (res.success && res.data && res.data.length > 0) {
                const ids = res.data;
                const undoId = `students-delete-all-${ids.join('-').substring(0, 30)}`;

                // Pre-flight check
                try {
                    const guardRes = await studentApi.bulkDelete(ids);
                    if (guardRes.requiresConfirmation && guardRes.hasActiveData) {
                        setActiveDataWarning(guardRes.message);
                        setPendingDeleteAction(() => () => {
                            queryClient.setQueryData(['students', id, page, debouncedSearch], (old) => {
                                if (!old) return old;
                                return { ...old, students: [], pagination: { ...old.pagination, total: 0 } };
                            });
                            setSelectedStudents(new Set());
                            enqueueUndo({
                                id: undoId,
                                type: 'Students',
                                label: `All ${ids.length} student(s)`,
                                highRisk: true,
                                apiCall: async () => {
                                    await studentApi.bulkDelete(ids, { confirm: true });
                                    queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                                    toast.success(`All ${ids.length} student(s) deleted`);
                                },
                                onUndo: () => {
                                    queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                                    toast.info(`Deletion of all ${ids.length} student(s) undone`);
                                }
                            });
                        });
                        setShowDeleteAllModal(false);
                        setIsProcessingDeleteAll(false);
                        return;
                    }
                } catch { /* proceed */ }

                // Optimistically clear current page cache
                queryClient.setQueryData(['students', id, page, debouncedSearch], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        students: [],
                        pagination: { ...old.pagination, total: 0 }
                    };
                });
                setSelectedStudents(new Set());

                enqueueUndo({
                    id: undoId,
                    type: 'Students',
                    label: `All ${ids.length} student(s)`,
                    highRisk: true,
                    apiCall: async () => {
                        await studentApi.bulkDelete(ids, { confirm: true });
                        queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                        toast.success(`All ${ids.length} student(s) deleted`);
                    },
                    onUndo: () => {
                        queryClient.invalidateQueries({ queryKey: ['students', id] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
                        toast.info(`Deletion of all ${ids.length} student(s) undone`);
                    }
                });
            } else {
                toast.info("No students found in this batch to delete.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch students for deletion.");
        } finally {
            setShowDeleteAllModal(false);
            setIsProcessingDeleteAll(false);
        }
    };

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-100 to-slate-200 relative">
            <OverlayLoader isLoading={isImporting} text="Importing students to batch..." />
            <OverlayLoader isLoading={isFetching && !loading} text="Loading students..." />
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
                        {selectedStudents.size > 0 ? (
                            <button onClick={handleBulkDelete} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all disabled:opacity-50">
                                <MdDelete className="w-5 h-5" /> {deleting ? 'Deleting...' : `Delete (${selectedStudents.size})`}
                            </button>
                        ) : (
                            <button onClick={handleDeleteAll} disabled={students.length === 0 || isProcessingDeleteAll} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all disabled:opacity-50">
                                <MdDelete className="w-5 h-5" /> Delete All
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />
                        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                            <MdPersonAdd className="w-5 h-5" /> Add
                        </button>
                        <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-300 shadow-sm text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all">
                            <MdFileUpload className="w-5 h-5 text-emerald-500" /> Import
                        </button>
                        <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-300 shadow-sm text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all">
                            <MdFileDownload className="w-5 h-5 text-blue-500" /> Export
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input type="text" placeholder="Search by name, ID, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 shadow-sm rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
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
                                    className="px-3 py-1.5 border-2 border-slate-300 shadow-sm rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-slate-600 font-medium px-2">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={!pagination.hasNext}
                                    className="px-3 py-1.5 border-2 border-slate-300 shadow-sm rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Student Modal — Faculty-style layout */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Register New Student</h3>
                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Fill in the details below to add a student to this batch</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                    <MdClose className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddStudent} className="p-6 overflow-y-auto flex-1">
                                {/* Student Information Section */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <MdPerson className="w-5 h-5 text-slate-600" />
                                        <h2 className="text-base font-bold text-slate-800">Student Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* First Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                                            <input type="text" required value={newStudent.firstName} onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                                                placeholder="e.g. Sara"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Last Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                                            <input type="text" required value={newStudent.lastName} onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                                                placeholder="e.g. Malik"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Roll Number */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Roll Number</label>
                                            <div className="relative">
                                                <MdBadge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <input type="text" required value={newStudent.roll_number} onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                                                    placeholder="e.g. 04162213027"
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                            </div>
                                        </div>

                                        {/* Phone Number */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <div className="relative">
                                                <MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <input type="tel" value={newStudent.contact_number} onChange={(e) => setNewStudent({ ...newStudent, contact_number: e.target.value })}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                            </div>
                                        </div>

                                        {/* University Email */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">University Email Address</label>
                                            <div className="relative">
                                                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <input type="email" required value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                                    placeholder="sara.malik@university.edu"
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1.5 font-medium">Must be a valid .edu email address</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Information Section */}
                                <div className="mb-6 pt-6 border-t border-slate-200">
                                    <div className="flex items-center gap-2 mb-5">
                                        <MdDescription className="w-5 h-5 text-slate-600" />
                                        <h2 className="text-base font-bold text-slate-800">Additional Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Parent Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Parent Name <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="text" value={newStudent.parentName} onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                                                placeholder="Parent's full name"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Parent Phone */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Parent Phone <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="tel" value={newStudent.parentPhone} onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                                                placeholder="+1 (555) 000-0000"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Parent Email */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Parent Email <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="email" value={newStudent.parentEmail} onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                                                placeholder="parent@example.com"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* CGPA */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">CGPA <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="number" step="0.01" min="0" max="4" value={newStudent.cgpa} onChange={(e) => setNewStudent({ ...newStudent, cgpa: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Matric Marks */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Matric Marks <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="number" value={newStudent.matric_marks} onChange={(e) => setNewStudent({ ...newStudent, matric_marks: e.target.value })}
                                                placeholder="e.g. 950"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* FSc Marks */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">FSc Marks <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="number" value={newStudent.fsc_marks} onChange={(e) => setNewStudent({ ...newStudent, fsc_marks: e.target.value })}
                                                placeholder="e.g. 900"
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400" />
                                        </div>

                                        {/* Academic Background */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Academic Background <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <select value={newStudent.background} onChange={(e) => setNewStudent({ ...newStudent, background: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white font-medium text-slate-800">
                                                <option value="">Select background...</option>
                                                <option value="pre-med">Pre-Medical</option>
                                                <option value="pre-engineering">Pre-Engineering</option>
                                                <option value="ics">ICS</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                                    <button type="button" onClick={() => setShowAddModal(false)}
                                        className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-sm transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={addStudentMutation.isPending}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm">
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
                                        <li><span className="font-bold text-emerald-600">student_id_number</span> (Required, Unique)</li>
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
                                    className="w-full mb-6 px-4 py-2.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-xl hover:bg-sky-100 font-semibold text-sm transition-all flex items-center justify-center gap-2">
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

                {/* Import Report Modal */}
                {importReport && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <MdDescription className="w-6 h-6 text-indigo-500" /> Import Summary
                                </h3>
                                <button onClick={() => setImportReport(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg">
                                    <MdClose className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="flex gap-4 mb-6">
                                    <div className="bg-emerald-50 text-emerald-700 px-5 py-4 rounded-xl border border-emerald-100 flex-1 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold mb-1">{importReport.imported || 0}</span>
                                        <span className="text-sm font-medium opacity-90 uppercase tracking-wider">Successfully Added</span>
                                    </div>
                                    <div className="bg-rose-50 text-rose-700 px-5 py-4 rounded-xl border border-rose-100 flex-1 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold mb-1">{importReport.skipped || 0}</span>
                                        <span className="text-sm font-medium opacity-90 uppercase tracking-wider">Skipped / Failed</span>
                                    </div>
                                </div>

                                {importReport.errors?.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Error Details (Row by Row)</h4>
                                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 w-20 text-center">Row</th>
                                                        <th className="px-4 py-3 w-40">Roll No / Email</th>
                                                        <th className="px-4 py-3">Error Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {importReport.errors.map((err, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3 text-center font-bold text-slate-700 bg-slate-50/50">{err.row}</td>
                                                            <td className="px-4 py-3 text-slate-600">
                                                                {err.roll_number && <div className="font-medium text-slate-800">{err.roll_number}</div>}
                                                                {err.email && <div className="text-xs text-slate-500 truncate max-w-[120px]">{err.email}</div>}
                                                            </td>
                                                            <td className="px-4 py-3 text-rose-600 font-medium">{err.error}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-xl">
                                <button
                                    onClick={() => setImportReport(null)}
                                    className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-sm font-medium"
                                >
                                    Close Report
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete All Confirmation Modal */}
                {showDeleteAllModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4 text-red-600">
                                    <div className="p-3 bg-red-100 rounded-full">
                                        <MdDelete className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">Delete All Students</h3>
                                </div>
                                <p className="text-slate-600 mb-2">
                                    Are you sure you want to delete <strong>ALL {students.length > 0 ? (pagination?.total || 'students') : ''}</strong> in this batch?
                                </p>
                                <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    This will trigger a bulk delete operation. This action cannot be easily undone once the undo timer expires.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
                                <button
                                    onClick={() => setShowDeleteAllModal(false)}
                                    disabled={isProcessingDeleteAll}
                                    className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeDeleteAll}
                                    disabled={isProcessingDeleteAll}
                                    className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isProcessingDeleteAll ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                                            Processing...
                                        </>
                                    ) : 'Yes, Delete All'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Data Warning Modal */}
                {activeDataWarning && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4 text-amber-600">
                                    <div className="p-3 bg-amber-100 rounded-full">
                                        <MdDelete className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">Active Data Warning</h3>
                                </div>
                                <p className="text-slate-600 mb-2">
                                    {activeDataWarning}
                                </p>
                                <p className="text-sm text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                    Proceeding may affect enrollments, grades, or other linked records. This action cannot be easily undone once the undo timer expires.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
                                <button
                                    onClick={() => { setActiveDataWarning(null); setPendingDeleteAction(null); }}
                                    className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const action = pendingDeleteAction;
                                        setActiveDataWarning(null);
                                        setPendingDeleteAction(null);
                                        if (action) action();
                                    }}
                                    className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    Yes, Force Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentList;
