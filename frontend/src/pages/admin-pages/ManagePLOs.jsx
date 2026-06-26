import React, { useState, useRef } from 'react';
import { PiCaretDown, PiCaretUp, PiDownloadSimple, PiMagnifyingGlass, PiPlus, PiTrash, PiUploadSimple, PiX } from 'react-icons/pi';
import { departmentApi } from '../../services/api';
import { toast } from 'react-toastify';
import OverlayLoader from '../../components/common/OverlayLoader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useUndoStore from '../../stores/useUndoStore';
import { createPortal } from 'react-dom';

const ManagePLOs = () => {
    const queryClient = useQueryClient();
    const [ploSearch, setPloSearch] = useState('');
    const [expandedPloId, setExpandedPloId] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    // Add PLO modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPlo, setNewPlo] = useState({ plo_number: '', description: '' });

    // Import modal
    const [showImportInfo, setShowImportInfo] = useState(false);
    const ploFileRef = useRef(null);

    const { data: allPLOs = [], isLoading: loading } = useQuery({
        queryKey: ['global_plos'],
        queryFn: async () => {
            const res = await departmentApi.getAllPLOs();
            if (res.success) return res.data || [];
            throw new Error('Failed to load PLOs');
        },
        staleTime: Infinity
    });

    const filteredPLOs = allPLOs.filter(p =>
        (p.description || '').toLowerCase().includes(ploSearch.toLowerCase()) ||
        String(p.plo_number).includes(ploSearch)
    );

    const handleOpenAddModal = () => {
        const nextNum = allPLOs.length > 0 ? Math.max(...allPLOs.map(p => p.plo_number)) + 1 : 1;
        setNewPlo({ plo_number: nextNum, description: '' });
        setShowAddModal(true);
    };

    const addPloMutation = useMutation({
        mutationFn: (data) => departmentApi.addPLO(data),
        onSuccess: () => {
            toast.success('PLO added successfully');
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['global_plos'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to add PLO');
        }
    });

    const handleAddSubmit = () => {
        if (!newPlo.plo_number || !newPlo.description) {
            toast.error('PLO number and description are required');
            return;
        }
        addPloMutation.mutate({
            plo_number: parseInt(newPlo.plo_number),
            description: newPlo.description
        });
    };

    const enqueueUndo = useUndoStore(s => s.enqueue);
    const isPendingUndo = useUndoStore(s => s.isPending);

    const handleDelete = (plo) => {
        const undoId = `plo-${plo.id}`;
        if (isPendingUndo(undoId)) return;

        // Optimistically remove
        queryClient.setQueryData(['global_plos'], (old) =>
            (old || []).filter(p => p.id !== plo.id)
        );

        enqueueUndo({
            id: undoId,
            type: 'PLO',
            label: `PLO-${plo.plo_number}`,
            apiCall: async () => {
                await departmentApi.deletePLO(plo.id);
                queryClient.invalidateQueries({ queryKey: ['global_plos'] });
                toast.success(`PLO-${plo.plo_number} deleted`);
            },
            onUndo: () => {
                queryClient.invalidateQueries({ queryKey: ['global_plos'] });
                toast.info(`Deletion of PLO-${plo.plo_number} undone`);
            }
        });
    };

    const importMutation = useMutation({
        mutationFn: (file) => departmentApi.importPLOs(file),
        onSuccess: (res) => {
            toast.success(`${res.data.imported} PLOs imported, ${res.data.skipped} skipped`);
            setShowImportInfo(false);
            queryClient.invalidateQueries({ queryKey: ['global_plos'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to import PLOs');
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

    const handleExport = () => { departmentApi.exportPLOs(); };

    return (
        <div className="min-h-[calc(100vh-116px)]">
            <OverlayLoader isLoading={isImporting} text="Importing PLOs..." />
            <div className="max-w-5xl mx-auto w-full flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg border border-sky-100 bg-sky-50"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Manage PLOs
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-5">
                            {loading ? 'Loading...' : `${allPLOs.length} Program Learning Outcomes`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-sky-100 shadow-sm text-slate-700 font-medium rounded-3xl hover:bg-slate-50 transition-all text-sm shadow-sm">
                            <PiDownloadSimple className="w-4 h-4" /> Export
                        </button>
                        <button onClick={() => setShowImportInfo(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-sky-100 shadow-sm text-slate-700 font-medium rounded-3xl hover:bg-slate-50 transition-all text-sm shadow-sm">
                            <PiUploadSimple className="w-4 h-4" /> Import
                        </button>
                        <button onClick={handleOpenAddModal}
                            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white font-medium rounded-3xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm">
                            <PiPlus className="w-4 h-4" /> Add PLO
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-4 mb-6">
                    <div className="relative">
                        <PiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search PLOs by number or description..."
                            value={ploSearch}
                            onChange={(e) => setPloSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-sky-100 rounded-3xl shadow-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* PLO List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-5 animate-pulse border border-sky-100">
                                <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredPLOs.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-sky-100">
                        <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <PiPlus className="w-8 h-8 text-sky-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">
                            {ploSearch ? 'No PLOs match your search' : 'No PLOs defined yet'}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {ploSearch ? 'Try a different search term' : 'Add your first Program Learning Outcome'}
                        </p>
                        {!ploSearch && (
                            <button onClick={handleOpenAddModal}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white font-medium rounded-3xl">
                                <PiPlus className="w-5 h-5" /> Add PLO
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredPLOs.map((plo) => {
                            const isExpanded = expandedPloId === plo.id;
                            return (
                                <div key={plo.id} className="rounded-3xl border border-sky-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md bg-white">
                                    <div
                                        className={`flex items-center justify-between p-4 cursor-pointer transition-all ${isExpanded ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                        onClick={() => setExpandedPloId(isExpanded ? null : plo.id)}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-100 text-xs font-bold rounded-md flex-shrink-0">
                                                PLO-{plo.plo_number}
                                            </span>
                                            <p className="text-sm font-medium text-slate-800 truncate">{plo.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(plo); }}
                                                disabled={isPendingUndo(`plo-${plo.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete PLO"
                                            >
                                                <PiTrash className="w-4 h-4" />
                                            </button>
                                            {isExpanded ? <PiCaretUp className="w-5 h-5 text-slate-400" /> : <PiCaretDown className="w-5 h-5 text-slate-400" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 p-6">
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">PLO Number</h4>
                                                    <p className="text-base font-bold text-slate-800">PLO-{plo.plo_number}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
                                                    <p className="text-sm text-slate-700 leading-relaxed">{plo.description}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Created</h4>
                                                    <p className="text-sm text-slate-500">{new Date(plo.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ========== Add PLO Modal ========== */}
            {showAddModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-md border border-sky-100 bg-sky-50"></div>
                                <h2 className="text-xl font-bold text-slate-800">Add PLO</h2>
                            </div>
                            <button onClick={() => setShowAddModal(false)} disabled={addPloMutation.isPending} className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
                                <PiX className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">PLO Number <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newPlo.plo_number}
                                    onChange={(e) => setNewPlo(prev => ({ ...prev, plo_number: e.target.value }))}
                                    placeholder="e.g., 1"
                                    className="w-full px-4 py-3 border border-sky-100 shadow-sm rounded-3xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Description <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={4}
                                    value={newPlo.description}
                                    onChange={(e) => setNewPlo(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe the Program Learning Outcome..."
                                    className="w-full px-4 py-3 border border-sky-100 shadow-sm rounded-3xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-slate-700 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                            <button onClick={() => setShowAddModal(false)} disabled={addPloMutation.isPending} className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-3xl hover:bg-white transition-all disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleAddSubmit}
                                disabled={!newPlo.plo_number || !newPlo.description || addPloMutation.isPending}
                                className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-3xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                <PiPlus className="w-4 h-4" /> {addPloMutation.isPending ? 'Adding...' : 'Add PLO'}
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}

            {/* ========== Import PLOs Modal ========== */}
            {showImportInfo && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-md border border-sky-100 bg-sky-50"></div>
                                <h2 className="text-xl font-bold text-slate-800">Import PLOs from Excel</h2>
                            </div>
                            <button onClick={() => setShowImportInfo(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <PiX className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Your Excel file should have the following columns:
                            </p>
                            <div className="bg-white border border-sky-100 rounded-3xl shadow-sm p-4 border border-sky-100">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 text-slate-600 font-semibold">Column</th>
                                            <th className="text-left py-2 text-slate-600 font-semibold">Example</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-100"><td className="py-1.5 font-medium">plo_number</td><td className="py-1.5 text-gray-500">1</td></tr>
                                        <tr><td className="py-1.5 font-medium">description</td><td className="py-1.5 text-gray-500">Apply knowledge of computing...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">PLOs are scoped to your department. Duplicate PLO numbers will update the existing description.</p>
                            <input type="file" accept=".xlsx,.xls" className="hidden" ref={ploFileRef} onChange={handleImportFile} />
                            <button onClick={() => ploFileRef.current.click()}
                                disabled={isImporting}
                                className="w-full py-3 bg-sky-600 text-white rounded-3xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                <PiUploadSimple className="w-5 h-5" /> {isImporting ? 'Importing...' : 'Select File to Import'}
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
};

export default ManagePLOs;
