import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PiArrowRight as MdChevronRight,
    PiCheck as MdCheck,
    PiEnvelopeSimple as MdEmail,
    PiFileText as MdDescription,
    PiIdentificationBadge as MdBadge,
    PiMagnifyingGlass as MdSearch,
    PiPhone as MdPhone,
    PiPlus as MdAdd,
    PiStudent as MdSchool,
    PiSwap as MdSwapHoriz,
    PiUploadSimple as MdFileUpload,
    PiUser as MdPerson,
    PiUsersThree as MdPeople,
    PiX as MdClose
} from 'react-icons/pi';
import { toast } from 'react-toastify';
import { studentApi, batchApi } from '../../services/api';
import OverlayLoader from '../../components/common/OverlayLoader';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCourse } from '../../context/CourseContext';

const RegisterStudent = () => {
    const navigate = useNavigate();
    const { assignmentId } = useParams();
    const { selectedCourse } = useCourse();
    const fileInputRef = useRef(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Cross-batch picker state
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [tempSelectedStudent, setTempSelectedStudent] = useState(null); // temp selection inside modal
    const [confirmedStudent, setConfirmedStudent] = useState(null);       // confirmed after OK

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        studentId: '',
        phoneNumber: '',
        email: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        matricMarks: '',
        fscMarks: '',
        background: '',
        sendWelcomeEmail: true
    });

    // Fetch batches for the picker modal
    const { data: batchesData } = useQuery({
        queryKey: ['allBatches'],
        enabled: showPickerModal,
        queryFn: async () => {
            const res = await batchApi.getAll({ limit: 100 });
            return res.success ? (res.data || []) : [];
        },
        staleTime: 5 * 60 * 1000
    });

    // Fetch students for selected batch
    const { data: batchStudents = [], isLoading: loadingStudents } = useQuery({
        queryKey: ['batchStudents', selectedBatchId, studentSearch],
        enabled: showPickerModal && !!selectedBatchId,
        queryFn: async () => {
            const res = await studentApi.getStudentsByBatch(selectedBatchId, studentSearch);
            return res.success ? (res.data || []) : [];
        },
        staleTime: 30 * 1000
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setStudentSearch(debouncedSearch), 300);
        return () => clearTimeout(timer);
    }, [debouncedSearch]);

    // Handle confirming the selected student (OK button)
    const handleConfirmStudent = () => {
        if (!tempSelectedStudent) return;
        setConfirmedStudent(tempSelectedStudent);
        setFormData({
            firstName: tempSelectedStudent.first_name || '',
            lastName: tempSelectedStudent.last_name || '',
            studentId: tempSelectedStudent.student_id_number || '',
            phoneNumber: tempSelectedStudent.phone || '',
            email: tempSelectedStudent.email || '',
            parentName: tempSelectedStudent.parent_name || '',
            parentEmail: tempSelectedStudent.parent_email || '',
            parentPhone: tempSelectedStudent.parent_phone || '',
            matricMarks: tempSelectedStudent.matric_marks ? String(tempSelectedStudent.matric_marks) : '',
            fscMarks: tempSelectedStudent.fsc_marks ? String(tempSelectedStudent.fsc_marks) : '',
            background: tempSelectedStudent.background || '',
            sendWelcomeEmail: false
        });
        setShowPickerModal(false);
    };

    // Open picker modal
    const handleOpenPicker = () => {
        setTempSelectedStudent(null);
        setSelectedBatchId('');
        setDebouncedSearch('');
        setStudentSearch('');
        setShowPickerModal(true);
    };

    // Close picker modal without confirming
    const handleClosePicker = () => {
        setTempSelectedStudent(null);
        setShowPickerModal(false);
    };

    // Clear the confirmed student (go back to manual mode)
    const handleClearStudent = () => {
        setConfirmedStudent(null);
        setFormData({
            firstName: '', lastName: '', studentId: '', phoneNumber: '',
            email: '', parentName: '', parentEmail: '', parentPhone: '',
            matricMarks: '', fscMarks: '', background: '', sendWelcomeEmail: true
        });
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const queryClient = useQueryClient();

    const registerMutation = useMutation({
        mutationFn: (data) => studentApi.facultyRegisterStudent(assignmentId, data),
        onSuccess: (response) => {
            toast.success(confirmedStudent ? 'Student enrolled from another batch successfully!' : 'Student registered successfully!');
            queryClient.invalidateQueries({ queryKey: ['enrolledStudents', String(assignmentId)] });
            queryClient.invalidateQueries({ queryKey: ['facultyDashboardCourses'] });
            queryClient.invalidateQueries({ queryKey: ['facultyAssignedCourse', String(assignmentId)] });
            navigate(-1);
        },
        onError: (error) => {
            console.error('Registration error:', error);
            toast.error(error.response?.data?.message || 'Failed to register student');
        }
    });

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const payload = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phoneNumber,
            student_id_number: formData.studentId,
            parent_name: formData.parentName,
            parent_email: formData.parentEmail,
            parent_phone: formData.parentPhone,
            matric_marks: formData.matricMarks ? Number(formData.matricMarks) : null,
            fsc_marks: formData.fscMarks ? Number(formData.fscMarks) : null,
            background: formData.background || null
        };

        // If a student was picked from a different batch, include their original batch_id
        if (confirmedStudent && confirmedStudent.batch_id) {
            payload.original_batch_id = confirmedStudent.batch_id;
        }

        registerMutation.mutate(payload);
    };

    // Handle cancel
    const handleCancel = () => {
        navigate(-1);
    };

    const handleImportClick = () => setShowImportModal(true);
    const triggerFileInput = () => {
        setShowImportModal(false);
        fileInputRef.current?.click();
    };

    const importMutation = useMutation({
        mutationFn: (file) => studentApi.facultyImportStudents(assignmentId, file),
        onSuccess: (response) => {
            const imported = response.data?.imported || 0;
            const skipped = response.data?.skipped || 0;
            
            if (skipped > 0) {
                const firstError = response.data?.errors?.[0]?.error || 'Unknown error';
                toast.warn(`Imported ${imported} students. Skipped ${skipped}. First error: ${firstError}`);
            } else {
                toast.success(`Imported and enrolled ${imported} students successfully!`);
            }
            queryClient.invalidateQueries({ queryKey: ['enrolledStudents', String(assignmentId)] });
            queryClient.invalidateQueries({ queryKey: ['facultyDashboardCourses'] });
            queryClient.invalidateQueries({ queryKey: ['facultyAssignedCourse', String(assignmentId)] });
            navigate(-1);
        },
        onError: (error) => {
            console.error('Import error:', error);
            toast.error(error.response?.data?.message || 'Failed to import students');
        },
        onSettled: () => {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsImporting(true);
            importMutation.mutate(file);
        } else {
            e.target.value = '';
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] space-y-6">
            <OverlayLoader isLoading={isImporting} text="Importing and enrolling students..." />
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4 font-medium">
                <Link to="/faculty-mycourses" className="hover:text-sky-700 transition-colors">
                    Courses
                </Link>
                <MdChevronRight className="w-4 h-4 mx-2 text-slate-400" />
                <span className="text-slate-400">{selectedCourse?.code || 'Course'}</span>
                <MdChevronRight className="w-4 h-4 mx-2 text-slate-400" />
                <span className="text-slate-800 font-semibold">Add Student</span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
                        Register New Student
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base font-medium">
                        Fill in the information below to manually enroll a student into the course. To add multiple students, use the CSV import tool.
                    </p>
                </div>
                <div className="flex gap-3">
                    <input type="file" accept=".csv,.xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <button type="button" onClick={handleImportClick} className="flex items-center justify-center px-5 py-2.5 bg-white text-slate-700 border border-sky-100 rounded-3xl hover:bg-sky-50/45 shadow-sm transition-colors font-semibold text-sm whitespace-nowrap">
                        <MdDescription className="w-5 h-5 mr-2" />
                        Import CSV
                    </button>
                </div>
            </div>

            {/* Cross-Batch Picker Banner */}
            <div className="bg-white/92 border border-sky-100 rounded-3xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-50 rounded-3xl flex items-center justify-center shadow-sm">
                            <MdSwapHoriz className="w-5 h-5 text-sky-700" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Enroll from Another Batch</h3>
                            <p className="text-xs text-slate-500 font-medium">Pick an existing student from a different batch (e.g., a student re-taking a course)</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenPicker}
                        className="px-5 py-2.5 bg-sky-600 text-white rounded-3xl font-semibold text-sm transition-all whitespace-nowrap hover:bg-sky-700 shadow-sm"
                    >
                        📋 Select Existing Student
                    </button>
                </div>

                {/* Confirmed Student Badge */}
                {confirmedStudent && (
                    <div className="mt-4 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-3xl shadow-sm">
                        <div className="w-9 h-9 rounded-3xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <MdCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-emerald-800">
                                {confirmedStudent.first_name} {confirmedStudent.last_name}
                            </p>
                            <p className="text-xs font-semibold text-emerald-600">{confirmedStudent.student_id_number} · {confirmedStudent.email}</p>
                        </div>
                        <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-3xl font-bold whitespace-nowrap">
                            From: {confirmedStudent.batch_name}
                        </span>
                        <button
                            type="button"
                            onClick={handleClearStudent}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-3xl transition-colors"
                            title="Clear selection"
                        >
                            <MdClose className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Main Form Card */}
            <form onSubmit={handleSubmit} className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 p-6 sm:p-8">
                {/* Student Information Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <MdPerson className="w-5 h-5 text-slate-600" />
                        <h2 className="text-xl font-bold text-slate-800">Student Information</h2>
                        {confirmedStudent && (
                            <span className="text-[10px] uppercase tracking-wider font-bold bg-sky-50 text-sky-700 px-2.5 py-1 rounded-3xl ml-2">Auto-filled from batch picker</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-bold text-slate-700 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="e.g. Sara"
                                className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                                required
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-bold text-slate-700 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="e.g. Malik"
                                className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                                required
                            />
                        </div>

                        {/* Roll Number */}
                        <div>
                            <label htmlFor="studentId" className="block text-sm font-bold text-slate-700 mb-2">
                                Roll Number
                            </label>
                            <div className="relative">
                                <MdBadge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    id="studentId"
                                    name="studentId"
                                    value={formData.studentId}
                                    onChange={handleChange}
                                    placeholder="e.g. 04162213027"
                                    className="w-full pl-10 pr-4 py-2.5 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-bold text-slate-700 mb-2">
                                Phone Number <span className="text-slate-400 font-medium">(Optional)</span>
                            </label>
                            <div className="relative">
                                <MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full pl-10 pr-4 py-2.5 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                                />
                            </div>
                        </div>

                        {/* Email Address - Full Width */}
                        <div className="md:col-span-2">
                            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                                University Email Address
                            </label>
                            <div className="relative">
                                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="sara.malik@university.edu"
                                    className="w-full pl-10 pr-4 py-2.5 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 font-medium">
                                Must be a valid .edu email address
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional Information Section */}
                <div className="mb-8 pt-8 border-t border-sky-100">
                    <div className="flex items-center gap-2 mb-6">
                        <MdDescription className="w-5 h-5 text-slate-600" />
                        <h2 className="text-xl font-bold text-slate-800">Additional Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="parentName" className="block text-sm font-bold text-slate-700 mb-2">
                                Parent Name <span className="text-slate-400 font-medium">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                id="parentName"
                                name="parentName"
                                value={formData.parentName}
                                onChange={handleChange}
                                placeholder="Parent's full name"
                                className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="parentPhone" className="block text-sm font-bold text-slate-700 mb-2">
                                Parent Phone <span className="text-slate-400 font-medium">(Optional)</span>
                            </label>
                            <input
                                type="tel"
                                id="parentPhone"
                                name="parentPhone"
                                value={formData.parentPhone}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-0000"
                                className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="parentEmail" className="block text-sm font-bold text-slate-700 mb-2">
                                Parent Email <span className="text-slate-400 font-medium">(Optional)</span>
                            </label>
                            <input
                                type="email"
                                id="parentEmail"
                                name="parentEmail"
                                value={formData.parentEmail}
                                onChange={handleChange}
                                placeholder="parent@example.com"
                                className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="matricMarks" className="block text-sm font-bold text-slate-700 mb-2">
                                Matric Marks <span className="text-slate-400 font-medium">(Optional)</span>
                            </label>
                            <input
                                type="number"
                                id="matricMarks"
                                name="matricMarks"
                                value={formData.matricMarks}
                                onChange={handleChange}
                                placeholder="e.g. 950"
                                className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="fscMarks" className="block text-sm font-bold text-slate-700 mb-2">
                                FSc Marks <span className="text-slate-400 font-medium">(Optional)</span>
                            </label>
                            <input
                                type="number"
                                id="fscMarks"
                                name="fscMarks"
                                value={formData.fscMarks}
                                onChange={handleChange}
                                placeholder="e.g. 900"
                                className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="background" className="block text-sm font-bold text-slate-700 mb-2">
                                Academic Background <span className="text-slate-400 font-medium">(Optional)</span>
                            </label>
                            <select
                                id="background"
                                name="background"
                                value={formData.background}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-transparent text-sm bg-white font-medium text-slate-800"
                            >
                                <option value="">Select background...</option>
                                <option value="pre-med">Pre-Medical</option>
                                <option value="pre-engineering">Pre-Engineering</option>
                                <option value="ics">ICS</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-sky-100 mt-8">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={registerMutation.isPending}
                        className="px-6 py-2.5 border border-sky-100 text-slate-700 rounded-3xl hover:bg-sky-50/45 font-semibold text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="px-6 py-2.5 bg-sky-600 text-white rounded-3xl hover:bg-sky-700 font-semibold text-sm transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    >
                        {registerMutation.isPending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-3xl animate-spin mr-2"></div>
                                {confirmedStudent ? 'Enrolling...' : 'Registering...'}
                            </>
                        ) : (
                            <>
                                <MdAdd className="w-5 h-5 mr-1.5" />
                                {confirmedStudent ? 'Enroll Student' : 'Add Student'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* ==================== STUDENT PICKER MODAL ==================== */}
            {showPickerModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-sky-100 bg-white/92 flex-shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <MdSwapHoriz className="w-5 h-5 text-sky-700" />
                                Select Student from Batch
                            </h3>
                            <button onClick={handleClosePicker} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-sky-50 rounded-3xl transition-colors">
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            {/* Batch Selector */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Select Batch</label>
                                <select
                                    value={selectedBatchId}
                                    onChange={(e) => { setSelectedBatchId(e.target.value); setTempSelectedStudent(null); setDebouncedSearch(''); }}
                                    className="w-full px-4 py-2.5 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white font-medium text-slate-800"
                                >
                                    <option value="">Choose a batch...</option>
                                    {(batchesData || []).map(batch => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.name} ({new Date(batch.start_date).getFullYear()} – {new Date(batch.end_date).getFullYear()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search Bar (visible after batch selected) */}
                            {selectedBatchId && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Search Student</label>
                                    <div className="relative">
                                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={debouncedSearch}
                                            onChange={(e) => setDebouncedSearch(e.target.value)}
                                            placeholder="Search by name or roll number..."
                                            className="w-full pl-10 pr-4 py-2.5 border border-sky-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Student List */}
                            {selectedBatchId && (
                                <div className="border border-sky-100 rounded-3xl overflow-hidden">
                                    <div className="max-h-72 overflow-y-auto">
                                        {loadingStudents ? (
                                            <div className="p-8 text-center">
                                                <div className="inline-block w-7 h-7 border-3 border-sky-100 border-t-indigo-600 rounded-3xl animate-spin mb-3"></div>
                                                <p className="text-slate-500 text-sm font-medium">Loading students...</p>
                                            </div>
                                        ) : batchStudents.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <MdPeople className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500 text-sm font-bold">No students found</p>
                                                <p className="text-slate-400 text-xs mt-1 font-medium">Try a different batch or search term</p>
                                            </div>
                                        ) : (
                                            batchStudents.map(student => (
                                                <button
                                                    key={student.id}
                                                    type="button"
                                                    onClick={() => setTempSelectedStudent(student)}
                                                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors border-b border-sky-100 last:border-b-0 ${
                                                        tempSelectedStudent?.id === student.id
                                                            ? 'bg-sky-50 ring-2 ring-inset ring-indigo-500'
                                                            : 'hover:bg-sky-50/45'
                                                    }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-3xl flex items-center justify-center flex-shrink-0 ${
                                                        tempSelectedStudent?.id === student.id
                                                            ? 'bg-sky-600'
                                                            : 'bg-sky-50'
                                                    }`}>
                                                        {tempSelectedStudent?.id === student.id ? (
                                                            <MdCheck className="w-5 h-5 text-white" />
                                                        ) : (
                                                            <span className="text-sky-700 font-bold text-xs">
                                                                {(student.first_name?.[0] || '')}{(student.last_name?.[0] || '')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">
                                                            {student.first_name} {student.last_name}
                                                        </p>
                                                        <p className="text-xs font-medium text-slate-500 truncate">
                                                            {student.student_id_number} · {student.email}
                                                        </p>
                                                    </div>
                                                    {tempSelectedStudent?.id === student.id && (
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-3xl">
                                                            Selected
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Selected Student Preview */}
                            {tempSelectedStudent && (
                                <div className="bg-sky-50 border border-sky-100 rounded-3xl p-4">
                                    <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-2">Selected Student</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <div><span className="text-slate-500 font-medium">Name:</span> <span className="font-bold text-slate-800">{tempSelectedStudent.first_name} {tempSelectedStudent.last_name}</span></div>
                                        <div><span className="text-slate-500 font-medium">Roll No:</span> <span className="font-bold text-slate-800">{tempSelectedStudent.student_id_number}</span></div>
                                        <div><span className="text-slate-500 font-medium">Email:</span> <span className="font-bold text-slate-800">{tempSelectedStudent.email}</span></div>
                                        <div><span className="text-slate-500 font-medium">Batch:</span> <span className="font-bold text-slate-800">{tempSelectedStudent.batch_name}</span></div>
                                        {tempSelectedStudent.phone && <div><span className="text-slate-500 font-medium">Phone:</span> <span className="font-bold text-slate-800">{tempSelectedStudent.phone}</span></div>}
                                        {tempSelectedStudent.parent_name && <div><span className="text-slate-500 font-medium">Parent:</span> <span className="font-bold text-slate-800">{tempSelectedStudent.parent_name}</span></div>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-5 border-t border-sky-100 bg-sky-50/45 flex-shrink-0">
                            <button
                                type="button"
                                onClick={handleClosePicker}
                                className="flex-1 px-4 py-2.5 border border-sky-100 text-slate-700 rounded-3xl hover:bg-sky-50 font-semibold text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmStudent}
                                disabled={!tempSelectedStudent}
                                className="flex-1 px-4 py-2.5 bg-sky-600 text-white rounded-3xl hover:bg-sky-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                <MdCheck className="w-5 h-5" />
                                OK — Use This Student
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== IMPORT MODAL ==================== */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-sky-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <MdFileUpload className="w-5 h-5 text-emerald-500" /> Import Students
                            </h3>
                            <button onClick={() => setShowImportModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-sky-50 rounded-3xl">
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <h4 className="font-semibold text-slate-800 mb-2">Excel File Format Requirements</h4>
                            <p className="text-sm text-slate-600 mb-4">Please ensure your Excel file (.xlsx or .csv) contains the following column headers exactly as shown:</p>
                            
                            <div className="bg-sky-50/45 rounded-3xl p-4 border border-sky-100 mb-6">
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

                            <div className="flex gap-3">
                                <button onClick={() => setShowImportModal(false)} className="flex-1 px-4 py-2.5 border-2 border-sky-100 shadow-sm text-slate-700 rounded-3xl hover:bg-sky-50/45 font-medium">Cancel</button>
                                <button onClick={triggerFileInput} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl hover:shadow-lg font-medium flex items-center justify-center gap-2">
                                    <MdFileUpload className="w-5 h-5" /> Select File
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterStudent;
