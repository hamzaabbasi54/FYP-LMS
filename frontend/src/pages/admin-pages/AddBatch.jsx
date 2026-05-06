import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdAdd, MdClose, MdArrowBack } from 'react-icons/md';
import { batchApi, authApi } from '../../services/api';
import { toast } from 'react-toastify';

const AddBatch = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');

    const [formData, setFormData] = useState({
        batchName: '',
        department_id: '',
        startDate: '',
        endDate: '',
        isActive: false
    });

    const [currentPlo, setCurrentPlo] = useState('');
    const [plos, setPlos] = useState([]);

    // Fetch faculties on mount
    useEffect(() => {
        const fetchFaculties = async () => {
            try {
                const response = await authApi.getFaculties();
                if (response.success) setFaculties(response.data || []);
            } catch (error) {
                console.error('Error fetching faculties:', error);
            }
        };
        fetchFaculties();
    }, []);

    // Fetch departments when faculty changes
    useEffect(() => {
        const fetchDepartments = async () => {
            if (selectedFaculty) {
                try {
                    const response = await authApi.getDepartments(selectedFaculty);
                    if (response.success) setDepartments(response.data || []);
                } catch (error) {
                    console.error('Error fetching departments:', error);
                }
            } else {
                setDepartments([]);
            }
        };
        fetchDepartments();
    }, [selectedFaculty]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleAddPlo = () => {
        if (currentPlo.trim()) {
            setPlos([...plos, currentPlo]);
            setCurrentPlo('');
        }
    };

    const handleRemovePlo = (index) => {
        setPlos(plos.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.batchName || !formData.department_id || !formData.startDate || !formData.endDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const response = await batchApi.create({
                name: formData.batchName,
                department_id: parseInt(formData.department_id),
                start_date: formData.startDate,
                end_date: formData.endDate,
                is_active: formData.isActive,
                plos: plos
            });

            if (response.success) {
                toast.success('Batch created successfully!');
                navigate('/admin-managebatches');
            }
        } catch (error) {
            console.error('Error creating batch:', error);
            toast.error(error.response?.data?.message || 'Failed to create batch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-3xl mx-auto">
                <div className="mb-6">
                    <Link to="/admin-managebatches" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Batches
                    </Link>
                </div>

                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Add New Batch
                        </h1>
                    </div>
                    <p className="text-slate-500 ml-5 mt-1">Create a new student cohort</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-6">
                            {/* Batch Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Batch Name <span className="text-red-500">*</span></label>
                                <input type="text" name="batchName" value={formData.batchName} onChange={handleChange}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50"
                                    placeholder="e.g., Batch 2026-2030" />
                            </div>

                            {/* Faculty Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Faculty <span className="text-red-500">*</span></label>
                                <select value={selectedFaculty} onChange={(e) => { setSelectedFaculty(e.target.value); setFormData({...formData, department_id: ''}); }}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50">
                                    <option value="">Select Faculty...</option>
                                    {faculties.map(fac => <option key={fac.id} value={fac.name}>{fac.name}</option>)}
                                </select>
                            </div>

                            {/* Department Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Department <span className="text-red-500">*</span></label>
                                <select name="department_id" value={formData.department_id} onChange={handleChange} disabled={!selectedFaculty}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50 disabled:bg-slate-100">
                                    <option value="">{selectedFaculty ? 'Select Department...' : 'Select Faculty first'}</option>
                                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                </select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Date <span className="text-red-500">*</span></label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50" />
                                </div>
                            </div>
                        </div>

                        {/* PLO Section */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                                <h3 className="text-lg font-bold text-slate-800">Program Learning Outcomes</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-4 ml-5">Define the learning outcomes for this batch</p>
                            <div className="space-y-4">
                                <textarea rows="3" value={currentPlo} onChange={(e) => setCurrentPlo(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-white resize-none"
                                    placeholder="Enter PLO description..." />
                                <button type="button" onClick={handleAddPlo} className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 text-sm font-medium rounded-xl hover:bg-violet-200 transition-colors">
                                    <MdAdd className="w-4 h-4" /> Add PLO
                                </button>
                                {plos.length > 0 && (
                                    <div className="space-y-2 mt-4">
                                        {plos.map((plo, index) => (
                                            <div key={index} className="flex justify-between items-start bg-white p-4 rounded-xl border border-slate-100">
                                                <div className="flex gap-3">
                                                    <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </span>
                                                    <p className="text-sm text-slate-600 pt-1">{plo}</p>
                                                </div>
                                                <button type="button" onClick={() => handleRemovePlo(index)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                                    <MdClose className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="p-6 border-t border-slate-100">
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                <div>
                                    <h4 className="font-semibold text-slate-800">Set as Active</h4>
                                    <p className="text-xs text-slate-500">Make this batch available immediately</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                            <button type="button" onClick={() => navigate('/admin-managebatches')} className="px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50">
                                {loading ? 'Creating...' : 'Create Batch'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddBatch;