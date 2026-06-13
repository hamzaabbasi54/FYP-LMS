import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdAdd, MdClose, MdArrowBack, MdSearch, MdCheck } from 'react-icons/md';
import { batchApi, authApi, departmentApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
const AddBatch = () => {
    const navigate = useNavigate();
    
    const { user } = useAuth();
    
    const deptId = user?.department_id;
    const isDeptAdmin = user?.role === 'deptadmin';

    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(isDeptAdmin ? 'auto' : '');

    const [formData, setFormData] = useState({
        batchName: '',
        department_id: isDeptAdmin ? (deptId || '') : '',
        startDate: '',
        endDate: '',
        isActive: false
    });

    // PLO selection state
    const [availablePLOs, setAvailablePLOs] = useState([]);
    const [selectedPLOIds, setSelectedPLOIds] = useState([]);
    const [ploSearch, setPloSearch] = useState('');
    const [plosLoading, setPlosLoading] = useState(false);

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

    // Fetch available PLOs for dept admin
    useEffect(() => {
        const fetchPLOs = async () => {
            setPlosLoading(true);
            try {
                const res = await departmentApi.getAllPLOs();
                if (res.success) setAvailablePLOs(res.data || []);
            } catch (err) {
                console.error('Error fetching PLOs:', err);
            } finally {
                setPlosLoading(false);
            }
        };
        fetchPLOs();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const togglePLO = (ploId) => {
        setSelectedPLOIds(prev =>
            prev.includes(ploId) ? prev.filter(id => id !== ploId) : [...prev, ploId]
        );
    };

    const selectedPLOs = availablePLOs.filter(p => selectedPLOIds.includes(p.id));
    const filteredAvailablePLOs = availablePLOs.filter(p =>
        (p.description || '').toLowerCase().includes(ploSearch.toLowerCase()) ||
        String(p.plo_number).includes(ploSearch)
    );

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
                plo_ids: selectedPLOIds
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
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="p-8 max-w-3xl mx-auto">
                <div className="mb-6">
                    <Link to="/admin-managebatches" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium">
                        <MdArrowBack className="w-4 h-4" /> Back to Batches
                    </Link>
                </div>

                <div className="mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            Add New Batch
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Create a new student cohort</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-5">
                            {/* Batch Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Batch Name <span className="text-red-500">*</span></label>
                                <input type="text" name="batchName" value={formData.batchName} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all"
                                    placeholder="e.g., Batch 2026-2030" />
                            </div>

                            {/* Faculty Selection */}
                            {!isDeptAdmin && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Faculty <span className="text-red-500">*</span></label>
                                    <select value={selectedFaculty} onChange={(e) => { setSelectedFaculty(e.target.value); setFormData({...formData, department_id: ''}); }}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none appearance-none bg-white transition-all">
                                        <option value="">Select Faculty...</option>
                                        {faculties.map(fac => <option key={fac.id} value={fac.name}>{fac.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Department Selection */}
                            {!isDeptAdmin ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Department <span className="text-red-500">*</span></label>
                                    <select name="department_id" value={formData.department_id} onChange={handleChange} disabled={!selectedFaculty}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none appearance-none bg-white transition-all disabled:bg-slate-50 disabled:cursor-not-allowed">
                                        <option value="">{selectedFaculty ? 'Select Department...' : 'Select Faculty first'}</option>
                                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                    <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                                        {user.department || 'Your Department'}
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date <span className="text-red-500">*</span></label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* PLO Selection Section */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                                    <h3 className="text-base font-semibold text-slate-800">Program Learning Outcomes</h3>
                                </div>
                                <Link to="/admin-managecourses/plos" className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                    Manage PLOs →
                                </Link>
                            </div>
                            <p className="text-xs text-slate-500 mb-4 ml-4">Select the PLOs to associate with this batch</p>

                            {/* Selected PLOs */}
                            {selectedPLOs.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {selectedPLOs.map(plo => (
                                        <div key={plo.id} className="flex justify-between items-start bg-blue-50 p-3 rounded-lg border border-blue-200">
                                            <div className="flex gap-2.5">
                                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">
                                                    {plo.plo_number}
                                                </span>
                                                <p className="text-sm text-blue-900 pt-0.5 font-medium">{plo.description}</p>
                                            </div>
                                            <button type="button" onClick={() => togglePLO(plo.id)} className="p-1 text-blue-400 hover:text-red-500 hover:bg-white rounded transition-colors">
                                                <MdClose className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Available PLOs picker */}
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                    <div className="relative">
                                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search PLOs..."
                                            value={ploSearch}
                                            onChange={(e) => setPloSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[250px] overflow-y-auto">
                                    {plosLoading ? (
                                        <div className="p-6 text-center text-slate-400 text-sm">Loading PLOs...</div>
                                    ) : filteredAvailablePLOs.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <p className="text-slate-400 text-sm mb-2">{ploSearch ? 'No PLOs match your search' : 'No PLOs available'}</p>
                                            <Link to="/admin-managecourses/plos" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                                Create PLOs first →
                                            </Link>
                                        </div>
                                    ) : (
                                        filteredAvailablePLOs.map(plo => {
                                            const isSelected = selectedPLOIds.includes(plo.id);
                                            return (
                                                <div
                                                    key={plo.id}
                                                    onClick={() => togglePLO(plo.id)}
                                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-all border-b border-slate-100 last:border-b-0 ${
                                                        isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                        isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                                    }`}>
                                                        {isSelected && <MdCheck className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded flex-shrink-0">
                                                        PLO-{plo.plo_number}
                                                    </span>
                                                    <p className="text-sm text-slate-600 truncate">{plo.description}</p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            {selectedPLOs.length > 0 && (
                                <p className="text-xs text-slate-500 mt-2 ml-1">{selectedPLOs.length} PLO(s) selected</p>
                            )}
                        </div>

                        {/* Active Toggle */}
                        <div className="p-6 border-t border-slate-100">
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div>
                                    <h4 className="font-medium text-slate-800 text-sm">Set as Active</h4>
                                    <p className="text-xs text-slate-500">Make this batch available immediately</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button type="button" onClick={() => navigate('/admin-managebatches')} className="px-4 py-2 border border-slate-200 bg-white shadow-sm text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm disabled:opacity-50">
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