import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdEdit, MdSave, MdClose, MdPerson, MdEmail, MdPhone, MdSchool, MdBadge, MdTrendingUp, MdWarning, MdAnalytics, MdScience } from 'react-icons/md';
import { studentApi, batchApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const InfoField = ({ icon: Icon, label, value, field, type = 'text', options, editable = true, editing, editData, handleChange }) => (
    <div className="flex items-start gap-4 p-4 bg-white border-2 border-slate-300 rounded-xl shadow-sm border-2 border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            {editing && editable ? (
                options ? (
                    <select value={editData[field] || ''} onChange={(e) => handleChange(field, e.target.value)}
                        className="w-full px-3 py-2 border-2 border-slate-300 shadow-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                        <option value="">Select...</option>
                        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                ) : (
                    <input type={type} value={editData[field] ?? ''} onChange={(e) => handleChange(field, e.target.value)}
                        className="w-full px-3 py-2 border-2 border-slate-300 shadow-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                )
            ) : (
                <p className={`text-sm font-medium ${value ? 'text-slate-800' : 'text-red-400 italic'}`}>
                    {value || 'Not set'}
                </p>
            )}
        </div>
    </div>
);

const StudentDetails = () => {
    const queryClient = useQueryClient();
    const { studentId, id: batchId } = useParams();
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});

    const { data: student, isLoading: loadingStudent } = useQuery({
        queryKey: ['student', studentId],
        queryFn: async () => {
            const res = await studentApi.getById(studentId);
            if (res.success) return res.data;
            throw new Error('Failed to load student');
        }
    });

    const { data: batches = [], isLoading: loadingBatches } = useQuery({
        queryKey: ['batches'],
        queryFn: async () => {
            const res = await batchApi.getAll({ limit: 100 });
            if (res.success) return res.data || [];
            throw new Error('Failed to load batches');
        }
    });

    const loading = loadingStudent || loadingBatches;

    useEffect(() => {
        if (student) {
            setEditData({
                first_name: student.first_name || '',
                last_name: student.last_name || '',
                email: student.email || '',
                phone: student.phone || '',
                student_id_number: student.student_id_number || '',
                batch_id: student.batch_id || '',
                cgpa: student.cgpa ?? '',
                matric_marks: student.matric_marks ?? '',
                fsc_marks: student.fsc_marks ?? '',
                background: student.background || '',
                is_active: student.is_active ?? true
            });
        }
    }, [student]);

    const updateMutation = useMutation({
        mutationFn: (payload) => studentApi.update(studentId, payload),
        onSuccess: () => {
            toast.success('Student updated successfully');
            setEditing(false);
            queryClient.invalidateQueries({ queryKey: ['student', studentId] });
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update student');
        }
    });

    const handleSave = () => {
        const payload = { ...editData };
        if (payload.cgpa === '') payload.cgpa = null;
        if (payload.matric_marks === '') payload.matric_marks = null;
        if (payload.fsc_marks === '') payload.fsc_marks = null;
        if (payload.batch_id === '') payload.batch_id = null;

        updateMutation.mutate(payload);
    };

    const handleChange = (field, value) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const handleCancel = () => {
        setEditing(false);
        if (student) {
            setEditData({
                first_name: student.first_name || '',
                last_name: student.last_name || '',
                email: student.email || '',
                phone: student.phone || '',
                student_id_number: student.student_id_number || '',
                batch_id: student.batch_id || '',
                cgpa: student.cgpa ?? '',
                matric_marks: student.matric_marks ?? '',
                fsc_marks: student.fsc_marks ?? '',
                background: student.background || '',
                is_active: student.is_active ?? true
            });
        }
    };

    const getMissingFields = () => {
        if (!student) return [];
        const missing = [];
        if (!student.student_id_number) missing.push('Roll Number');
        if (!student.phone) missing.push('Phone');
        if (student.cgpa == null || student.cgpa === 0) missing.push('CGPA');
        if (student.matric_marks == null) missing.push('Matric Marks');
        if (student.fsc_marks == null) missing.push('FSc Marks');
        if (!student.background) missing.push('Background');
        if (!student.batch_id) missing.push('Batch');
        return missing;
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
            <div className="max-w-4xl mx-auto animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
                <div className="h-64 bg-slate-200 rounded-2xl mb-6"></div>
                <div className="h-48 bg-slate-200 rounded-2xl"></div>
            </div>
        </div>
    );

    if (!student) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-600 mb-2">Student not found</h2>
                <Link to={`/admin-managebatches/${batchId}/students`} className="text-blue-600 hover:underline">Back to Students</Link>
            </div>
        </div>
    );

    const missingFields = getMissingFields();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link to={`/admin-managebatches/${batchId}/students`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Students
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl font-bold">
                                    {(student.first_name || '?')[0]}{(student.last_name || '?')[0]}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">
                                    {student.first_name} {student.last_name}
                                </h1>
                                <div className="flex items-center gap-3 mt-1">
                                    {student.student_id_number && (
                                        <span className="px-3 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold font-mono">
                                            {student.student_id_number}
                                        </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${student.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {student.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    {student.batch_name && (
                                        <span className="text-xs text-slate-500">{student.batch_name}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {editing ? (
                                <>
                                    <button onClick={handleCancel} disabled={updateMutation.isPending}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-slate-300 shadow-sm text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 disabled:opacity-50">
                                        <MdClose className="w-4 h-4" /> Cancel
                                    </button>
                                    <button onClick={handleSave} disabled={updateMutation.isPending}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium text-sm hover:shadow-lg disabled:opacity-50">
                                        <MdSave className="w-4 h-4" /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setEditing(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
                                    <MdEdit className="w-4 h-4" /> Edit Student
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {missingFields.length > 0 && !editing && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                        <MdWarning className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800">Missing Information</p>
                            <p className="text-sm text-amber-600 mt-0.5">
                                The following fields are not set: <strong>{missingFields.join(', ')}</strong>.
                                Click "Edit Student" to fill them in.
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                        <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoField icon={MdPerson} label="First Name" value={student.first_name} field="first_name" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={MdPerson} label="Last Name" value={student.last_name} field="last_name" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={MdEmail} label="Email" value={student.email} field="email" type="email" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={MdPhone} label="Phone" value={student.phone} field="phone" editing={editing} editData={editData} handleChange={handleChange} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                        <h3 className="text-lg font-bold text-slate-800">Academic Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoField icon={MdBadge} label="Roll Number" value={student.student_id_number} field="student_id_number" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={MdSchool} label="Batch" value={student.batch_name}
                            field="batch_id"
                            options={batches.map(b => ({ value: b.id, label: b.name }))}
                            editing={editing} editData={editData} handleChange={handleChange}
                        />
                        <InfoField icon={MdTrendingUp} label="CGPA" value={student.cgpa != null ? parseFloat(student.cgpa).toFixed(2) : null} field="cgpa" type="number" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={MdScience} label="Background"
                            value={student.background ? student.background.charAt(0).toUpperCase() + student.background.slice(1).replace('-', ' ') : null}
                            field="background"
                            options={[
                                { value: 'pre-med', label: 'Pre-Med' },
                                { value: 'pre-engineering', label: 'Pre-Engineering' },
                                { value: 'ics', label: 'ICS' }
                            ]}
                            editing={editing} editData={editData} handleChange={handleChange}
                        />
                        <InfoField icon={MdAnalytics} label="Matric Marks" value={student.matric_marks} field="matric_marks" type="number" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={MdAnalytics} label="FSc Marks" value={student.fsc_marks} field="fsc_marks" type="number" editing={editing} editData={editData} handleChange={handleChange} />
                    </div>
                </div>

                {student.parent && (
                    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                            <h3 className="text-lg font-bold text-slate-800">Parent / Guardian</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoField icon={MdPerson} label="Parent Name" value={student.parent.name} field="parent_name" editable={false} editing={editing} editData={editData} handleChange={handleChange} />
                            <InfoField icon={MdEmail} label="Parent Email" value={student.parent.email} field="parent_email" editable={false} editing={editing} editData={editData} handleChange={handleChange} />
                            <InfoField icon={MdPhone} label="Parent Phone" value={student.parent.phone} field="parent_phone" editable={false} editing={editing} editData={editData} handleChange={handleChange} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDetails;
