import React, { useState } from 'react';
import { MdClose, MdSearch, MdAdd } from 'react-icons/md';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../services/api';
import { toast } from 'react-toastify';

const MapCourseCLOModal = ({ isOpen, onClose, courseId, existingClos = [] }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('select'); // 'select' or 'create'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCloIds, setSelectedCloIds] = useState(new Set());
    
    // Create new CLO state
    const [newClo, setNewClo] = useState({ title: '', description: '', cognitive_level: '' });

    // Fetch all global CLOs
    const { data: globalClos = [], isLoading } = useQuery({
        queryKey: ['global_clos'],
        queryFn: async () => {
            const res = await courseApi.getAllClos();
            if (res.success) return res.data || [];
            throw new Error('Failed to load global CLOs');
        },
        enabled: isOpen && activeTab === 'select'
    });

    // Mutations
    const mapMutation = useMutation({
        mutationFn: (cloIds) => courseApi.mapClosToCourse(courseId, cloIds),
        onSuccess: () => {
            toast.success('CLOs mapped to course successfully');
            queryClient.invalidateQueries({ queryKey: ['course', String(courseId)] });
            onClose();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to map CLOs');
        }
    });

    const createMutation = useMutation({
        mutationFn: (data) => courseApi.addSingleClo(courseId, data),
        onSuccess: () => {
            toast.success('New CLO created and mapped successfully');
            queryClient.invalidateQueries({ queryKey: ['course', String(courseId)] });
            queryClient.invalidateQueries({ queryKey: ['global_clos'] });
            onClose();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to create CLO');
        }
    });

    if (!isOpen) return null;

    // Filter available CLOs (exclude already mapped ones)
    const existingIds = new Set(existingClos.map(c => c.id));
    const availableClos = globalClos.filter(c => !existingIds.has(c.id));
    
    const filteredClos = availableClos.filter(c => 
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelection = (id) => {
        const next = new Set(selectedCloIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedCloIds(next);
    };

    const handleMapSubmit = () => {
        if (selectedCloIds.size === 0) {
            toast.error('Please select at least one CLO to map');
            return;
        }
        mapMutation.mutate(Array.from(selectedCloIds));
    };

    const handleCreateSubmit = () => {
        if (!newClo.title) {
            toast.error('CLO title is required');
            return;
        }
        if (!/^CLO-\d+$/.test(newClo.title)) {
            toast.error('CLO title must be in CLO-X format (e.g. CLO-1)');
            return;
        }
        createMutation.mutate({
            title: newClo.title,
            description: newClo.description,
            cognitive_level: newClo.cognitive_level
        });
    };

    const getCognitiveColor = (level) => {
        const map = {
            C1: 'bg-sky-100 text-sky-700 border-sky-200',
            C2: 'bg-teal-100 text-teal-700 border-teal-200',
            C3: 'bg-amber-100 text-amber-700 border-amber-200',
            C4: 'bg-orange-100 text-orange-700 border-orange-200',
            C5: 'bg-rose-100 text-rose-700 border-rose-200',
            C6: 'bg-violet-100 text-violet-700 border-violet-200'
        };
        return map[level] || 'bg-gray-100 text-gray-600 border-gray-200';
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Add Global CLOs to Course</h2>
                        <p className="text-sm text-slate-500 mt-1">Changes here update the core course catalog blueprint.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-slate-100">
                        <MdClose className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex border-b border-gray-200 bg-slate-50 px-6">
                    <button 
                        className={`py-4 px-6 text-sm font-bold border-b-2 transition-all ${activeTab === 'select' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('select')}
                    >
                        Select Existing CLOs
                    </button>
                    <button 
                        className={`py-4 px-6 text-sm font-bold border-b-2 transition-all ${activeTab === 'create' ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Create New CLO
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'select' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search global CLOs..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all"
                                />
                            </div>

                            {isLoading ? (
                                <div className="text-center py-8 text-slate-500">Loading CLOs...</div>
                            ) : filteredClos.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                                    No available CLOs found. Try creating a new one!
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredClos.map(clo => (
                                        <label key={clo.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedCloIds.has(clo.id) ? 'border-sky-500 bg-sky-50' : 'border-slate-100 bg-white hover:border-sky-200'}`}>
                                            <div className="pt-0.5">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedCloIds.has(clo.id)}
                                                    onChange={() => toggleSelection(clo.id)}
                                                    className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-800">{clo.title}</span>
                                                    {clo.cognitive_level && (
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getCognitiveColor(clo.cognitive_level)}`}>
                                                            {clo.cognitive_level}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed mb-2">{clo.description || 'No description'}</p>
                                                
                                                {clo.mapped_courses && clo.mapped_courses.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        <span className="text-[10px] text-slate-400 mr-1 flex items-center font-medium">Mapped to:</span>
                                                        {clo.mapped_courses.slice(0, 3).map(mc => (
                                                            <span key={mc.id} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200" title={mc.title}>
                                                                {mc.code}
                                                            </span>
                                                        ))}
                                                        {clo.mapped_courses.length > 3 && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-100">
                                                                +{clo.mapped_courses.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="mt-1">
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded font-medium">
                                                            Standalone Global CLO
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'create' && (
                        <div className="space-y-5 max-w-lg mx-auto">
                            <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 mb-2">
                                <p className="text-sm text-sky-800">
                                    <strong>Note:</strong> Creating a CLO here will add it to the global catalog and immediately map it to this course.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">CLO Title *</label>
                                <input 
                                    type="text" 
                                    value={newClo.title} 
                                    onChange={(e) => setNewClo({ ...newClo, title: e.target.value.toUpperCase() })}
                                    className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100 ${newClo.title && !/^CLO-\d+$/.test(newClo.title) ? 'border-red-400' : 'border-slate-200'}`}
                                    placeholder="CLO-1" 
                                />
                                {newClo.title && !/^CLO-\d+$/.test(newClo.title) && (
                                    <span className="text-xs text-red-500 mt-1 block">Format must be CLO-X (e.g. CLO-1)</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                                <textarea 
                                    rows="3" 
                                    value={newClo.description} 
                                    onChange={(e) => setNewClo({ ...newClo, description: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100" 
                                    placeholder="Describe this learning outcome..." 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Cognitive Level</label>
                                <select 
                                    value={newClo.cognitive_level} 
                                    onChange={(e) => setNewClo({ ...newClo, cognitive_level: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                >
                                    <option value="">Select Level</option>
                                    <option value="C1">C1 - Remember</option>
                                    <option value="C2">C2 - Understand</option>
                                    <option value="C3">C3 - Apply</option>
                                    <option value="C4">C4 - Analyze</option>
                                    <option value="C5">C5 - Evaluate</option>
                                    <option value="C6">C6 - Create</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-gray-200 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        disabled={mapMutation.isPending || createMutation.isPending}
                    >
                        Cancel
                    </button>
                    {activeTab === 'select' ? (
                        <button 
                            onClick={handleMapSubmit} 
                            disabled={mapMutation.isPending || selectedCloIds.size === 0} 
                            className="px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {mapMutation.isPending ? 'Mapping...' : `Map ${selectedCloIds.size > 0 ? selectedCloIds.size : ''} CLOs`}
                        </button>
                    ) : (
                        <button 
                            onClick={handleCreateSubmit} 
                            disabled={createMutation.isPending || !newClo.title} 
                            className="px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <MdAdd className="w-5 h-5" />
                            {createMutation.isPending ? 'Creating...' : 'Create & Map'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapCourseCLOModal;
