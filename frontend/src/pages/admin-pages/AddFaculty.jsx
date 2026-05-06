import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import { authApi } from '../../services/api';
import { toast } from 'react-toastify';

const AddFaculty = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');

    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', contactNumber: '',
        dob: '', designation: '', department_id: '', joiningDate: '',
        expertise: '', bio: ''
    });

    useEffect(() => {
        const fetchFaculties = async () => {
            try {
                const res = await authApi.getFaculties();
                if (res.success) setFaculties(res.data || []);
            } catch (err) { console.error(err); }
        };
        fetchFaculties();
    }, []);

    useEffect(() => {
        const fetchDepts = async () => {
            if (selectedFaculty) {
                try {
                    const res = await authApi.getDepartments(selectedFaculty);
                    if (res.success) setDepartments(res.data || []);
                } catch (err) { console.error(err); }
            } else { setDepartments([]); }
        };
        fetchDepts();
    }, [selectedFaculty]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.email || !formData.department_id) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            // Register as pre-approved faculty
            const response = await authApi.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password || 'TempPass123!',
                role: 'faculty',
                department_id: parseInt(formData.department_id),
                designation: formData.designation,
                contact_number: formData.contactNumber
            });

            if (response.success) {
                toast.success('Faculty member added successfully!');
                navigate('/admin-managefaculty');
            }
        } catch (error) {
            console.error('Error adding faculty:', error);
            toast.error(error.response?.data?.message || 'Failed to add faculty');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-6 max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to="/admin-managefaculty" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Faculty
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Personal Information */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Personal Information</h3>
                            <p className="text-sm text-gray-500 mb-6">Enter the basic details of the new faculty member.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. Dr. Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. jane.doe@university.edu" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Temporary Password</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Leave empty for default" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                                    <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. +1 (555) 123-4567" />
                                </div>
                            </div>
                        </div>

                        <hr className="my-8 border-gray-100" />

                        {/* Section 2: Professional Details */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Professional Details</h3>
                            <p className="text-sm text-gray-500 mb-6">Specify the faculty member's role and department.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                                    <select name="designation" value={formData.designation} onChange={handleChange}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">Select Designation</option>
                                        <option value="Professor">Professor</option>
                                        <option value="Associate Professor">Associate Professor</option>
                                        <option value="Assistant Professor">Assistant Professor</option>
                                        <option value="Lecturer">Lecturer</option>
                                        <option value="Visiting Faculty">Visiting Faculty</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty <span className="text-red-500">*</span></label>
                                    <select value={selectedFaculty} onChange={(e) => { setSelectedFaculty(e.target.value); setFormData({...formData, department_id: ''}); }}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">Select Faculty</option>
                                        {faculties.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department <span className="text-red-500">*</span></label>
                                    <select name="department_id" value={formData.department_id} onChange={handleChange} disabled={!selectedFaculty}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100">
                                        <option value="">{selectedFaculty ? 'Select Department' : 'Select Faculty first'}</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Areas of Expertise</label>
                                <input type="text" name="expertise" value={formData.expertise} onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Artificial Intelligence, Machine Learning" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => navigate('/admin-managefaculty')}
                                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50">
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