import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdClose } from 'react-icons/md';

const AddBatch = () => {
    const navigate = useNavigate();

    // --- Form State ---
    const [formData, setFormData] = useState({
        batchName: '',
        startDate: '',
        endDate: '',
        isActive: false
    });

    // --- PLO State (Dynamic List) ---
    const [currentPlo, setCurrentPlo] = useState('');
    const [plos, setPlos] = useState([]);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Add the current PLO text to the list
    const handleAddPlo = () => {
        if (currentPlo.trim()) {
            setPlos([...plos, currentPlo]);
            setCurrentPlo(''); // Clear input
        }
    };

    // Remove a PLO from the list
    const handleRemovePlo = (index) => {
        const newPlos = plos.filter((_, i) => i !== index);
        setPlos(newPlos);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Batch Data:", { ...formData, plos });
        alert("New Batch Created Successfully!");
        navigate('/admin-managebatches');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">

            {/* Page Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Batch</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <form onSubmit={handleSubmit}>

                    {/* Batch Name */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Batch Name</label>
                        <input
                            type="text"
                            name="batchName"
                            value={formData.batchName}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                            placeholder="e.g., '2026-2030'"
                        />
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100 mb-8" />

                    {/* PLO Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800">Program Learning Outcomes (PLOs)</h3>
                        <p className="text-sm text-gray-500 mb-4">Define the learning outcomes associated with this batch.</p>

                        <label className="block text-sm font-semibold text-gray-700 mb-2">PLO Description</label>
                        <textarea
                            rows="3"
                            value={currentPlo}
                            onChange={(e) => setCurrentPlo(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 resize-none"
                            placeholder="Enter PLO description here..."
                        ></textarea>

                        <div className="mt-4 flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={handleAddPlo}
                                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded hover:bg-gray-300 transition"
                            >
                                Add PLO
                            </button>
                        </div>

                        {/* List of Added PLOs (Feedback for user) */}
                        {plos.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {plos.map((plo, index) => (
                                    <div key={index} className="flex justify-between items-start bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-100">
                                        <span><span className="font-bold mr-2">PLO-{index + 1}:</span> {plo}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePlo(index)}
                                            className="text-blue-400 hover:text-red-500"
                                        >
                                            <MdClose />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100 mb-8" />

                    {/* Toggle Switch: Set as Active */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100 mb-8">
                        <div>
                            <h4 className="font-bold text-gray-800">Set as Active</h4>
                            <p className="text-xs text-gray-500">Make this batch available in the system immediately.</p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end items-center space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin-managebatches')}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition"
                        >
                            Create Batch
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddBatch;