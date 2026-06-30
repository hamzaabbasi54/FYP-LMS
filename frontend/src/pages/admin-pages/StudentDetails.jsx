import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    PiArrowLeft, PiBookOpen, PiChartLineUp, PiEnvelopeSimple, PiFloppyDisk,
    PiGauge, PiGraduationCap, PiIdentificationBadge, PiPencilSimple, PiPhone,
    PiStudent, PiUser, PiUsersThree, PiWarningCircle, PiX
} from 'react-icons/pi';
import { studentApi, batchApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const InfoField = ({ icon: Icon, label, value, field, type = 'text', options, editable = true, editing, editData, handleChange, min, max, step }) => (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/50 p-4 shadow-[0_8px_24px_rgba(14,116,144,0.06)]">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
            {React.createElement(Icon, { className: 'h-5 w-5' })}
        </div>
        <div className="flex-1 min-w-0">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
            {editing && editable ? (
                options ? (
                    <select value={editData[field] || ''} onChange={(e) => handleChange(field, e.target.value)}
                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100">
                        <option value="">Select...</option>
                        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                ) : (
                    <input type={type} value={editData[field] ?? ''} onChange={(e) => handleChange(field, e.target.value)} min={min} max={max} step={step}
                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
                )
            ) : (
                <p className={`break-words text-sm font-semibold ${value || value === 0 ? 'text-slate-800' : 'italic text-rose-400'}`}>
                    {value || value === 0 ? value : 'Not set'}
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
            // Keep the editable form synchronized when a different student record loads.
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="min-h-full bg-[#eff8ff] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl animate-pulse space-y-5">
                <div className="h-5 w-40 rounded-full bg-sky-100" />
                <div className="h-40 rounded-3xl bg-white" />
                <div className="h-72 rounded-3xl bg-white" />
            </div>
        </div>
    );

    if (!student) return (
        <div className="flex min-h-full items-center justify-center bg-[#eff8ff] p-6">
            <div className="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-8 text-center shadow-lg">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"><PiStudent className="h-7 w-7" /></div>
                <h2 className="mt-4 text-xl font-bold text-slate-950">Student not found</h2>
                <Link to={`/admin-managebatches/${batchId}/students`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
                    <PiArrowLeft className="h-4 w-4" /> Back to Students
                </Link>
            </div>
        </div>
    );

    const missingFields = getMissingFields();

    return (
        <div className="min-h-full bg-[#eff8ff] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-5">
                    <Link to={`/admin-managebatches/${batchId}/students`} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900">
                        <PiArrowLeft className="h-4 w-4" /> Back to Students
                    </Link>
                </div>

                <div className="relative mb-5 overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-white via-sky-50 to-blue-100/70 p-5 shadow-[0_24px_70px_rgba(14,116,144,0.14)] sm:p-6">
                    <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-sky-200/40 blur-3xl" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-600 shadow-[0_12px_28px_rgba(2,132,199,0.25)]">
                                <span className="text-xl font-bold text-white">
                                    {(student.first_name || '?')[0]}{(student.last_name || '?')[0]}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Student Profile</p>
                                <h1 className="mt-1 break-words text-2xl font-bold text-slate-950 sm:text-3xl">
                                    {student.first_name} {student.last_name}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {student.student_id_number && (
                                        <span className="rounded-full border border-sky-200 bg-white/80 px-3 py-1 font-mono text-xs font-bold text-sky-700">
                                            {student.student_id_number}
                                        </span>
                                    )}
                                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${student.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                                        {student.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    {student.batch_name && (
                                        <span className="text-xs font-medium text-slate-500">{student.batch_name}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            {editing ? (
                                <>
                                    <button onClick={handleCancel} disabled={updateMutation.isPending}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-sky-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 disabled:opacity-50">
                                        <PiX className="h-4 w-4" /> Cancel
                                    </button>
                                    <button onClick={handleSave} disabled={updateMutation.isPending}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50">
                                        <PiFloppyDisk className="h-4 w-4" /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setEditing(true)}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md">
                                    <PiPencilSimple className="h-4 w-4" /> Edit Student
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {missingFields.length > 0 && !editing && (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                        <PiWarningCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                        <div>
                            <p className="text-sm font-bold text-amber-900">Missing Information</p>
                            <p className="mt-0.5 text-sm leading-6 text-amber-800">
                                The following fields are not set: <strong>{missingFields.join(', ')}</strong>.
                                Select Edit Student to fill them in.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mb-5 rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_16px_42px_rgba(14,116,144,0.08)] sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700"><PiUser className="h-5 w-5" /></div>
                        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Campus Flow</p><h3 className="text-lg font-bold text-slate-950">Personal Information</h3></div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InfoField icon={PiUser} label="First Name" value={student.first_name} field="first_name" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={PiUser} label="Last Name" value={student.last_name} field="last_name" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={PiEnvelopeSimple} label="Email" value={student.email} field="email" type="email" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={PiPhone} label="Phone" value={student.phone} field="phone" editing={editing} editData={editData} handleChange={handleChange} />
                    </div>
                </div>

                <div className="mb-5 rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_16px_42px_rgba(14,116,144,0.08)] sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700"><PiGraduationCap className="h-5 w-5" /></div>
                        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Campus Flow</p><h3 className="text-lg font-bold text-slate-950">Academic Information</h3></div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InfoField icon={PiIdentificationBadge} label="Roll Number" value={student.student_id_number} field="student_id_number" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={PiUsersThree} label="Batch" value={student.batch_name}
                            field="batch_id"
                            options={batches.map(b => ({ value: b.id, label: b.name }))}
                            editing={editing} editData={editData} handleChange={handleChange}
                        />
                        <InfoField icon={PiGauge} label="CGPA" value={student.cgpa != null ? parseFloat(student.cgpa).toFixed(2) : null} field="cgpa" type="number" min="0" max="4" step="0.01" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={PiBookOpen} label="Background"
                            value={student.background ? student.background.charAt(0).toUpperCase() + student.background.slice(1).replace('-', ' ') : null}
                            field="background"
                            options={[
                                { value: 'pre-med', label: 'Pre-Med' },
                                { value: 'pre-engineering', label: 'Pre-Engineering' },
                                { value: 'ics', label: 'ICS' }
                            ]}
                            editing={editing} editData={editData} handleChange={handleChange}
                        />
                        <InfoField icon={PiChartLineUp} label="Matric Marks" value={student.matric_marks} field="matric_marks" type="number" min="0" editing={editing} editData={editData} handleChange={handleChange} />
                        <InfoField icon={PiChartLineUp} label="FSc Marks" value={student.fsc_marks} field="fsc_marks" type="number" min="0" editing={editing} editData={editData} handleChange={handleChange} />
                    </div>
                </div>

                {student.parent && (
                    <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_16px_42px_rgba(14,116,144,0.08)] sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700"><PiUsersThree className="h-5 w-5" /></div>
                            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Campus Flow</p><h3 className="text-lg font-bold text-slate-950">Parent / Guardian</h3></div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <InfoField icon={PiUser} label="Parent Name" value={student.parent.name} field="parent_name" editable={false} editing={editing} editData={editData} handleChange={handleChange} />
                            <InfoField icon={PiEnvelopeSimple} label="Parent Email" value={student.parent.email} field="parent_email" editable={false} editing={editing} editData={editData} handleChange={handleChange} />
                            <InfoField icon={PiPhone} label="Parent Phone" value={student.parent.phone} field="parent_phone" editable={false} editing={editing} editData={editData} handleChange={handleChange} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDetails;
