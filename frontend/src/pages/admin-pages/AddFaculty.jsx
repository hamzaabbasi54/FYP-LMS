import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PiArrowLeft, PiFloppyDisk, PiUserPlus } from 'react-icons/pi';
import { authApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AddFaculty = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedFaculty, setSelectedFaculty] = useState('');

    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', contactNumber: '',
        dob: '', designation: '', department_id: '', joiningDate: '',
        expertise: '', bio: ''
    });

    const { data: faculties = [] } = useQuery({
        queryKey: ['faculties'],
        queryFn: async () => {
            const res = await authApi.getFaculties();
            return res.success ? (res.data || []) : [];
        }
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments', selectedFaculty],
        queryFn: async () => {
            const res = await authApi.getDepartments(selectedFaculty);
            return res.success ? (res.data || []) : [];
        },
        enabled: !!selectedFaculty
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const registerMutation = useMutation({
        mutationFn: (data) => authApi.register(data),
        onSuccess: () => {
            toast.success('Faculty member added successfully!');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            navigate('/admin-managefaculty');
        },
        onError: (error) => {
            console.error('Error adding faculty:', error);
            toast.error(error.response?.data?.message || 'Failed to add faculty');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.email || !formData.department_id) {
            toast.error('Please fill in all required fields');
            return;
        }

        registerMutation.mutate({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password || 'TempPass123!',
            role: 'faculty',
            department_id: parseInt(formData.department_id),
            designation: formData.designation,
            contact_number: formData.contactNumber
        });
    };
    
    const loading = registerMutation.isPending;

    return (
        <div className="min-h-[calc(100vh-116px)]">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                {/* Breadcrumb */}
                <div>
                    <Link to="/admin-managefaculty" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-sky-700">
                        <PiArrowLeft className="w-4 h-4" /> Back to Faculty
                    </Link>
                </div>

                <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.10)] backdrop-blur-2xl">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                            <PiUserPlus className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-950">Add Faculty</h1>
                            <p className="mt-1 text-sm leading-6 text-slate-600">Create a faculty account and assign a department.</p>
                        </div>
                    </div>
                </section>

                <div className="bg-white/92 rounded-3xl shadow-sm border border-sky-100 p-8">
                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Personal Information */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">Personal Information</h3>
                            <p className="text-sm text-slate-500 mb-6">Enter the basic details of the new faculty member.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        placeholder="e.g. Dr. Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        placeholder="e.g. jane.doe@university.edu" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Temporary Password</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        placeholder="Leave empty for default" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                                    <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        placeholder="e.g. +1 (555) 123-4567" />
                                </div>
                            </div>
                        </div>

                        <hr className="my-8 border-slate-100" />

                        {/* Section 2: Professional Details */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">Professional Details</h3>
                            <p className="text-sm text-slate-500 mb-6">Specify the faculty member's role and department.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                                    <select name="designation" value={formData.designation} onChange={handleChange}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100">
                                        <option value="">Select Designation</option>
                                        <option value="Professor">Professor</option>
                                        <option value="Associate Professor">Associate Professor</option>
                                        <option value="Assistant Professor">Assistant Professor</option>
                                        <option value="Lecturer">Lecturer</option>
                                        <option value="Visiting Faculty">Visiting Faculty</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Faculty <span className="text-red-500">*</span></label>
                                    <select value={selectedFaculty} onChange={(e) => { setSelectedFaculty(e.target.value); setFormData({...formData, department_id: ''}); }}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100">
                                        <option value="">Select Faculty</option>
                                        {faculties.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Department <span className="text-red-500">*</span></label>
                                    <select name="department_id" value={formData.department_id} onChange={handleChange} disabled={!selectedFaculty}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-50">
                                        <option value="">{selectedFaculty ? 'Select Department' : 'Select Faculty first'}</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Areas of Expertise</label>
                                <input type="text" name="expertise" value={formData.expertise} onChange={handleChange}
                                    className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                    placeholder="e.g. Artificial Intelligence, Machine Learning" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end items-center space-x-4 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => navigate('/admin-managefaculty')}
                                className="px-6 py-2.5 bg-white border border-sky-100 text-slate-700 font-semibold rounded-xl hover:bg-sky-50 transition-colors text-sm">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 shadow-sm transition-colors disabled:opacity-50 text-sm">
                                <PiFloppyDisk className="h-4 w-4" />
                                {loading ? 'Submitting...' : 'Add Faculty'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddFaculty;
