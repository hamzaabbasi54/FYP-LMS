import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
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
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="p-6 max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to="/admin-managefaculty" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Faculty
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Personal Information */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">Personal Information</h3>
                            <p className="text-sm text-slate-500 mb-6">Enter the basic details of the new faculty member.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                        placeholder="e.g. Dr. Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                        placeholder="e.g. jane.doe@university.edu" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Temporary Password</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                        placeholder="Leave empty for default" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                                    <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
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
                                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm">
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
                                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm">
                                        <option value="">Select Faculty</option>
                                        {faculties.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Department <span className="text-red-500">*</span></label>
                                    <select name="department_id" value={formData.department_id} onChange={handleChange} disabled={!selectedFaculty}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-slate-50 transition-all text-sm">
                                        <option value="">{selectedFaculty ? 'Select Department' : 'Select Faculty first'}</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Areas of Expertise</label>
                                <input type="text" name="expertise" value={formData.expertise} onChange={handleChange}
                                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                                    placeholder="e.g. Artificial Intelligence, Machine Learning" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end items-center space-x-4 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => navigate('/admin-managefaculty')}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 text-sm">
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