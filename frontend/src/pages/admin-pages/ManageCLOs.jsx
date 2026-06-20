import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdAdd, MdFileUpload, MdFileDownload, MdClose, MdExpandMore, MdExpandLess, MdDelete } from 'react-icons/md';
import { courseApi } from '../../services/api';
import { toast } from 'react-toastify';
import OverlayLoader from '../../components/common/OverlayLoader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useUndoStore from '../../stores/useUndoStore';

const ManageCLOs = () => {
    const queryClient = useQueryClient();
    const [cloSearch, setCloSearch] = useState('');
    const [expandedCloId, setExpandedCloId] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    // Add CLO modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newClo, setNewClo] = useState({ title: '', description: '', cognitive_level: '' });

    // Import modal
    const [showImportInfo, setShowImportInfo] = useState(false);
    const cloFileRef = useRef(null);

    const { data: allCLOs = [], isLoading: loading } = useQuery({
        queryKey: ['global_clos'],
        queryFn: async () => {
            const res = await courseApi.getAllCLOs();
            if (res.success) return res.data || [];
            throw new Error('Failed to load CLOs');
        }
    });

    const filteredCLOs = allCLOs.filter(c =>
        (c.title || '').toLowerCase().includes(cloSearch.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(cloSearch.toLowerCase())
    );

    const handleOpenAddModal = () => {
        setNewClo({ title: '', description: '', cognitive_level: '' });
        setShowAddModal(true);
    };

    const addCloMutation = useMutation({
        mutationFn: (data) => courseApi.addGlobalCLO(data),
        onSuccess: () => {
            toast.success('CLO added successfully');
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['global_clos'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to add CLO');
        }
    });

    const handleAddSubmit = () => {
        if (!newClo.title) {
            toast.error('CLO title is required');
            return;
        }
        if (!/^CLO-\d+$/.test(newClo.title)) {
            toast.error('CLO title must be in CLO-X format (e.g. CLO-1)');
            return;
        }
        addCloMutation.mutate({
            title: newClo.title,
            description: newClo.description,
            cognitive_level: newClo.cognitive_level
        });
    };
    const importMutation = useMutation({
        mutationFn: (file) => courseApi.importCLOs(file),
        onSuccess: (res) => {
            toast.success(`${res.data.imported} CLOs imported, ${res.data.skipped} skipped`);
            setShowImportInfo(false);
            queryClient.invalidateQueries({ queryKey: ['global_clos'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to import CLOs');
        },
        onSettled: () => {
            setIsImporting(false);
        }
    });

    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsImporting(true);
        importMutation.mutate(file);
        e.target.value = '';
    };

    const handleExport = () => { courseApi.exportCLOs(); };

    const enqueueUndo = useUndoStore(s => s.enqueue);
    const isPendingUndo = useUndoStore(s => s.isPending);

    const handleDeleteCLO = (clo) => {
        const undoId = `clo-${clo.id}`;
        if (isPendingUndo(undoId)) return;

        // Optimistically remove
        queryClient.setQueryData(['global_clos'], (old) =>
            (old || []).filter(c => c.id !== clo.id)
        );

        enqueueUndo({
            id: undoId,
            type: 'CLO',
            label: clo.title,
            apiCall: async () => {
                await courseApi.deleteGlobalCLO(clo.id);
                queryClient.invalidateQueries({ queryKey: ['global_clos'] });
                toast.success(`${clo.title} deleted`);
            },
            onUndo: () => {
                queryClient.invalidateQueries({ queryKey: ['global_clos'] });
                toast.info(`Deletion of ${clo.title} undone`);
            }
        });
    };

    const getCognitiveLabel = (level) => {
        const map = { C1: 'Remember', C2: 'Understand', C3: 'Apply', C4: 'Analyze', C5: 'Evaluate', C6: 'Create' };
        return level ? `${level} - ${map[level] || ''}` : 'Not specified';
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

    const renderCloRow = (clo) => {
        const isExpanded = expandedCloId === clo.id;
        return (
            <div key={clo.id} className="border-b border-slate-100 overflow-hidden bg-white">
                <div
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    onClick={() => setExpandedCloId(isExpanded ? null : clo.id)}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                            {clo.title}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">{clo.description || 'No description'}</p>
                            {clo.mapped_courses && clo.mapped_courses.length > 0 && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {clo.mapped_courses.map(c => c.code).join(', ')}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {clo.cognitive_level && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getCognitiveColor(clo.cognitive_level)}`}>
                                {clo.cognitive_level}
                            </span>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteCLO(clo); }}
                            disabled={isPendingUndo(`clo-${clo.id}`)}
                            className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors disabled:opacity-50"
                            title={`Delete ${clo.title}`}
                        >
                            <MdDelete className="w-5 h-5" />
                        </button>
                        {isExpanded ? <MdExpandLess className="w-5 h-5 text-slate-300 hover:text-slate-600 transition-colors" /> : <MdExpandMore className="w-5 h-5 text-slate-300 hover:text-slate-600 transition-colors" />}
                    </div>
                </div>

                {isExpanded && (
                    <div className="border-t border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left column */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CLO Number</h4>
                                    <p className="text-base font-bold text-slate-800">{clo.title}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
                                    <p className="text-sm text-slate-700 leading-relaxed">{clo.description || 'No description provided'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cognitive Level (Bloom's Taxonomy)</h4>
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-lg border ${getCognitiveColor(clo.cognitive_level)}`}>
                                        {getCognitiveLabel(clo.cognitive_level)}
                                    </span>
                                </div>
                            </div>

                            {/* Right column */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Mapped Courses ({clo.mapped_courses?.length || 0})
                                    </h4>
                                    {clo.mapped_courses && clo.mapped_courses.length > 0 ? (
                                        <div className="space-y-2">
                                            {clo.mapped_courses.map(c => (
                                                <div key={c.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-slate-300 shadow-sm">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {c.code?.substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{c.title}</p>
                                                        <p className="text-xs text-slate-500">{c.code}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Not mapped to any course yet</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Mapped PLOs ({clo.mapped_plos?.length || 0})
                                    </h4>
                                    {clo.mapped_plos && clo.mapped_plos.length > 0 ? (
                                        <div className="space-y-2">
                                            {clo.mapped_plos.map(p => (
                                                <div key={p.id} className="flex items-start gap-2 p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                                                    <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 text-xs font-bold rounded flex-shrink-0">
                                                        PLO-{p.plo_number}
                                                    </span>
                                                    <p className="text-xs text-indigo-700 leading-relaxed">{p.description || ''}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No PLOs mapped to this CLO</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-96px)] bg-gradient-to-br from-slate-200/80 to-slate-300/80 rounded-3xl p-4 md:p-6 shadow-md border border-slate-300/60 overflow-y-auto flex flex-col">
            <OverlayLoader isLoading={isImporting} text="Importing CLOs..." />
            <div className="max-w-6xl mx-auto w-full flex flex-col">
                {/* Breadcrumb */}
                <Link to="/admin-managecourses" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm mb-4">
                    <MdArrowBack className="w-4 h-4" /> Back to Courses
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-2 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                CLO Management
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${allCLOs.length} CLOs across all courses`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExport}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm">
                            <MdFileDownload className="w-4 h-4" /> Export
                        </button>
                        <button onClick={() => setShowImportInfo(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all">
                            <MdFileUpload className="w-4 h-4" /> Import
                        </button>
                        <button onClick={handleOpenAddModal}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all">
                            <MdAdd className="w-4 h-4" /> Add CLO
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 p-3 mb-5">
                    <div className="relative">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" placeholder="Search CLOs by number (e.g. CLO-1), course code, title, or description..."
                            value={cloSearch} onChange={(e) => setCloSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-slate-300 rounded-xl shadow-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all" />
                    </div>
                </div>

                {/* Stats bar */}
                {!loading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
                            <p className="text-2xl font-bold text-slate-900">{allCLOs.length}</p>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Total CLOs</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
                            <p className="text-2xl font-bold text-slate-900">
                                {allCLOs.filter(c => c.mapped_courses && c.mapped_courses.length > 0).length}
                            </p>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Course Mapped</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
                            <p className="text-2xl font-bold text-slate-900">
                                {allCLOs.filter(c => c.mapped_plos && c.mapped_plos.length > 0).length}
                            </p>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">PLO Mapped</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
                            <p className="text-2xl font-bold text-slate-900">
                                {allCLOs.filter(c => !c.mapped_plos || c.mapped_plos.length === 0).length}
                            </p>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Unmapped</p>
                        </div>
                    </div>
                )}

                {/* CLO List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white rounded-xl p-4 animate-pulse border-2 border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="h-7 w-16 bg-slate-200 rounded-lg"></div>
                                    <div className="flex-1"><div className="h-4 bg-slate-200 rounded w-2/3"></div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredCLOs.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MdSearch className="w-8 h-8 text-amber-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">
                            {cloSearch ? 'No CLOs match your search' : 'No CLOs found'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {cloSearch ? 'Try different keywords' : 'Add CLOs to courses to see them here'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredCLOs.map(clo => renderCloRow(clo))}
                    </div>
                )}
            </div>

            {/* Add CLO Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">Add New CLO</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700"><MdClose className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-gray-500">CLO title must be in <strong>CLO-X</strong> format (e.g. CLO-1, CLO-2). Auto-capitalized.</p>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">CLO Title *</label>
                                <input type="text" value={newClo.title} onChange={(e) => setNewClo({ ...newClo, title: e.target.value.toUpperCase() })}
                                    className={`w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20 ${newClo.title && !/^CLO-\d+$/.test(newClo.title) ? 'border-red-400' : 'border-gray-300'}`}
                                    placeholder="CLO-1" />
                                {newClo.title && !/^CLO-\d+$/.test(newClo.title) && (
                                    <span className="text-xs text-red-500">Format must be CLO-X (e.g. CLO-1)</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                <textarea rows="3" value={newClo.description} onChange={(e) => setNewClo({ ...newClo, description: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-amber-500/20" placeholder="Describe this learning outcome..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Cognitive Level</label>
                                <select value={newClo.cognitive_level} onChange={(e) => setNewClo({ ...newClo, cognitive_level: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500/20">
                                    <option value="">Select</option>
                                    <option value="C1">C1 - Remember</option><option value="C2">C2 - Understand</option>
                                    <option value="C3">C3 - Apply</option><option value="C4">C4 - Analyze</option>
                                    <option value="C5">C5 - Evaluate</option><option value="C6">C6 - Create</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowAddModal(false)} disabled={addCloMutation.isPending} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                            <button onClick={handleAddSubmit} disabled={addCloMutation.isPending} className="px-5 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50">
                                {addCloMutation.isPending ? 'Adding...' : 'Add CLO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Info Modal */}
            {showImportInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">Import CLOs from Excel</h2>
                            <button onClick={() => setShowImportInfo(false)} className="text-gray-500 hover:text-gray-700"><MdClose className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">Your Excel file must have the following columns:</p>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-left border-b border-gray-300">
                                        <th className="pb-2 font-bold text-gray-700">Column</th>
                                        <th className="pb-2 font-bold text-gray-700">Example</th>
                                        <th className="pb-2 font-bold text-gray-700">Required</th>
                                    </tr></thead>
                                    <tbody>
                                        <tr className="border-b border-gray-100"><td className="py-1.5 font-medium">clo_number</td><td className="py-1.5 text-gray-500">1</td><td className="py-1.5 text-red-500">Yes</td></tr>
                                        <tr className="border-b border-gray-100"><td className="py-1.5 font-medium">title</td><td className="py-1.5 text-gray-500">CLO-1</td><td className="py-1.5 text-gray-400">No (Auto-generated if omitted)</td></tr>
                                        <tr className="border-b border-gray-100"><td className="py-1.5 font-medium">description</td><td className="py-1.5 text-gray-500">Understand basics</td><td className="py-1.5 text-gray-400">No</td></tr>
                                        <tr><td className="py-1.5 font-medium">cognitive_level</td><td className="py-1.5 text-gray-500">C2</td><td className="py-1.5 text-gray-400">No</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">CLOs imported here are global and can be mapped to any course later.</p>
                            <input type="file" accept=".xlsx,.xls" className="hidden" ref={cloFileRef} onChange={handleImportFile} />
                            <button onClick={() => cloFileRef.current.click()}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                                <MdFileUpload className="w-5 h-5" /> Choose Excel File
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCLOs;
