import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PiArrowLeft, PiCheck, PiMagnifyingGlass, PiPlus, PiX } from 'react-icons/pi';
import { batchApi, authApi, departmentApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
const AddBatch = () => {
    const navigate = useNavigate();

    const { user } = useAuth();

    const deptId = user?.department_id;
    const isDeptAdmin = user?.role === 'deptadmin';

    const queryClient = useQueryClient();
    const [selectedFaculty, setSelectedFaculty] = useState(isDeptAdmin ? 'auto' : '');

    const [formData, setFormData] = useState({
        batchName: '',
        department_id: isDeptAdmin ? (deptId || '') : '',
        startDate: '',
        endDate: '',
        isActive: false
    });

    // PLO selection state
    const [selectedPLOIds, setSelectedPLOIds] = useState([]);
    const [ploSearch, setPloSearch] = useState('');

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
        enabled: !!selectedFaculty && !isDeptAdmin
    });

    const { data: availablePLOs = [], isLoading: plosLoading } = useQuery({
        queryKey: ['plos'],
        queryFn: async () => {
            const res = await departmentApi.getAllPLOs();
            return res.success ? (res.data || []) : [];
        }
    });

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

    const createBatchMutation = useMutation({
        mutationFn: (data) => batchApi.create(data),
        onSuccess: () => {
            toast.success('Batch created successfully!');
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            navigate('/admin-managebatches');
        },
        onError: (error) => {
            console.error('Error creating batch:', error);
            toast.error(error.response?.data?.message || 'Failed to create batch');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.batchName || !formData.department_id || !formData.startDate || !formData.endDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Prevent batches starting in future years
        const currentYear = new Date().getFullYear();
        const startYear = new Date(formData.startDate).getFullYear();
        if (startYear > currentYear) {
            toast.error(`Start year cannot be in the future (after ${currentYear})`);
            return;
        }

        createBatchMutation.mutate({
            name: formData.batchName,
            department_id: parseInt(formData.department_id),
            start_date: formData.startDate,
            end_date: formData.endDate,
            is_active: formData.isActive,
            plo_ids: selectedPLOIds
        });
    };

    const loading = createBatchMutation.isPending;

    return (
        <div className="min-h-[calc(100vh-116px)]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <div>
                    <Link to="/admin-managebatches" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-sky-700">
                        <PiArrowLeft className="w-4 h-4" /> Back to Batches
                    </Link>
                </div>

                <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.10)] backdrop-blur-2xl">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                    <h1 className="mt-3 text-3xl font-bold text-slate-950">Add New Batch</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Create a new student cohort and attach program learning outcomes.</p>
                </section>

                <div className="bg-white/92 rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Batch Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Batch Name <span className="text-red-500">*</span></label>
                                <input type="text" name="batchName" value={formData.batchName} onChange={handleChange}
                                    className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                    placeholder="e.g., Batch 2026-2030" />
                            </div>

                            {/* Faculty Selection */}
                            {!isDeptAdmin && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Faculty <span className="text-red-500">*</span></label>
                                    <select value={selectedFaculty} onChange={(e) => { setSelectedFaculty(e.target.value); setFormData({ ...formData, department_id: '' }); }}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none appearance-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100">
                                        <option value="">Select Faculty...</option>
                                        {faculties.map(fac => <option key={fac.id} value={fac.name}>{fac.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Department Selection */}
                            {!isDeptAdmin ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Department <span className="text-red-500">*</span></label>
                                    <select name="department_id" value={formData.department_id} onChange={handleChange} disabled={!selectedFaculty}
                                        className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none appearance-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-50 disabled:cursor-not-allowed">
                                        <option value="">{selectedFaculty ? 'Select Department...' : 'Select Faculty first'}</option>
                                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                                    <div className="h-11 w-full rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-sm text-slate-600">
                                        {user.department || 'Your Department'}
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                                    max={`${new Date().getFullYear()}-12-31`}
                                    className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
                                <p className="text-xs text-slate-400 mt-1">Start year cannot be in the future</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">End Date <span className="text-red-500">*</span></label>
                                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                                    className="h-11 w-full rounded-xl border border-sky-100 bg-white px-3 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100" />
                            </div>
                        </div>

                        {/* PLO Selection Section */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg border border-sky-100 bg-sky-50"></div>
                                    <h3 className="text-base font-semibold text-slate-800">Program Learning Outcomes</h3>
                                </div>
                                <Link to="/admin-managecourses/plos" className="text-xs text-sky-700 hover:text-sky-800 font-semibold transition-colors">
                                    Manage PLOs →
                                </Link>
                            </div>
                            <p className="text-xs text-slate-500 mb-4 ml-4">Select the PLOs to associate with this batch</p>

                            {/* Selected PLOs */}
                            {selectedPLOs.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4 max-h-[120px] overflow-y-auto p-1 custom-scrollbar">
                                    {selectedPLOs.map(plo => (
                                        <div key={plo.id} className="flex items-center gap-1.5 bg-sky-50 pl-2.5 pr-1 py-1 rounded-lg border border-sky-200 shadow-sm transition-all hover:bg-sky-100">
                                            <span className="font-bold text-xs text-sky-800">PLO-{plo.plo_number}</span>
                                            <span className="text-xs text-slate-600 max-w-[180px] truncate" title={plo.description}>{plo.description}</span>
                                            <button type="button" onClick={() => togglePLO(plo.id)} className="ml-0.5 rounded-md p-1 text-sky-400 hover:bg-white hover:text-red-500 transition-colors">
                                                <PiX className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Available PLOs picker */}
                            <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                                <div className="p-3 border-b border-sky-100 bg-sky-50/40">
                                    <div className="relative">
                                        <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search PLOs..."
                                            value={ploSearch}
                                            onChange={(e) => setPloSearch(e.target.value)}
                                            className="h-10 w-full rounded-xl border border-sky-100 bg-white pl-9 pr-4 text-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[250px] overflow-y-auto">
                                    {plosLoading ? (
                                        <div className="p-6 text-center text-slate-400 text-sm">Loading PLOs...</div>
                                    ) : filteredAvailablePLOs.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <p className="text-slate-400 text-sm mb-2">{ploSearch ? 'No PLOs match your search' : 'No PLOs available'}</p>
                                            <Link to="/admin-managecourses/plos" className="text-xs text-sky-700 hover:text-sky-800 font-semibold">
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
                                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-all border-b border-slate-100 last:border-b-0 ${isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                                                        }`}>
                                                        {isSelected && <PiCheck className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="px-2 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-md border border-sky-100 flex-shrink-0">
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
                            <div className="flex items-center justify-between bg-sky-50/45 p-4 rounded-2xl border border-sky-100">
                                <div>
                                    <h4 className="font-medium text-slate-800 text-sm">Set as Active</h4>
                                    <p className="text-xs text-slate-500">Make this batch available immediately</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-5 border-t border-sky-100 bg-sky-50/40 flex justify-end gap-3">
                            <button type="button" onClick={() => navigate('/admin-managebatches')} className="px-4 py-2 border border-sky-100 bg-white shadow-sm text-slate-700 font-semibold rounded-xl hover:bg-sky-50 transition-colors text-sm">Cancel</button>
                            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 shadow-sm transition-colors text-sm disabled:opacity-50">
                                <PiPlus className="h-4 w-4" />
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
