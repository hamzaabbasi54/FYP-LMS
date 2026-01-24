import React, { useRef, useState } from 'react';
import { MdSearch, MdPeople, MdEmail, MdPhone, MdSchool, MdFileUpload, MdFileDownload, MdPersonAdd, MdClose } from 'react-icons/md';

const Parents = () => {
    const fileInputRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newParent, setNewParent] = useState({
        parentName: '',
        email: '',
        phone: '',
        studentName: '',
        studentId: ''
    });

    // Mock Data - Random parents
    const parents = [
        { id: 1, name: 'Robert Johnson', email: 'robert.j@email.com', phone: '+1 234-567-8901', studentName: 'Alice Johnson', studentId: 'U2024001' },
        { id: 2, name: 'Mary Williams', email: 'mary.w@email.com', phone: '+1 345-678-9012', studentName: 'Bob Williams', studentId: 'U2024002' },
        { id: 3, name: 'David Brown', email: 'david.b@email.com', phone: '+1 456-789-0123', studentName: 'Charlie Brown', studentId: 'U2024003' },
        { id: 4, name: 'Sarah Miller', email: 'sarah.m@email.com', phone: '+1 567-890-1234', studentName: 'Diana Miller', studentId: 'U2024004' },
        { id: 5, name: 'Michael Davis', email: 'michael.d@email.com', phone: '+1 678-901-2345', studentName: 'Ethan Davis', studentId: 'U2024005' },
        { id: 6, name: 'Jennifer Garcia', email: 'jennifer.g@email.com', phone: '+1 789-012-3456', studentName: 'Fiona Garcia', studentId: 'U2024006' },
        { id: 7, name: 'James Wilson', email: 'james.w@email.com', phone: '+1 890-123-4567', studentName: 'George Wilson', studentId: 'U2024007' },
        { id: 8, name: 'Patricia Martinez', email: 'patricia.m@email.com', phone: '+1 901-234-5678', studentName: 'Hannah Martinez', studentId: 'U2024008' },
    ];

    // Filter parents based on search query
    const filteredParents = parents.filter((parent) => {
        const query = searchQuery.toLowerCase();
        return (
            parent.name.toLowerCase().includes(query) ||
            parent.studentName.toLowerCase().includes(query) ||
            parent.studentId.toLowerCase().includes(query) ||
            parent.email.toLowerCase().includes(query)
        );
    });

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('Selected file:', file.name);
            alert(`File "${file.name}" selected. Excel import functionality will be implemented.`);
        }
        e.target.value = '';
    };

    const handleAddParent = (e) => {
        e.preventDefault();
        console.log('Adding parent:', newParent);
        alert(`Parent "${newParent.parentName}" added successfully!`);
        setShowAddModal(false);
        setNewParent({ parentName: '', email: '', phone: '', studentName: '', studentId: '' });
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Parents Directory</h1>
                <p className="text-gray-600">Manage and view parent information for enrolled students</p>
            </div>

            {/* Search and Stats */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by parent name, student name, or student ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="bg-blue-50 px-4 py-2.5 rounded-lg flex items-center gap-2">
                    <MdPeople className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                        {searchQuery ? `Found: ${filteredParents.length}` : `Total Parents: ${parents.length}`}
                    </span>
                </div>
            </div>

            {/* Parents Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left py-4 px-6 text-xs uppercase text-gray-500 font-bold tracking-wider">Student ID</th>
                            <th className="text-left py-4 px-6 text-xs uppercase text-gray-500 font-bold tracking-wider">Student Name</th>
                            <th className="text-left py-4 px-6 text-xs uppercase text-gray-500 font-bold tracking-wider">Parent Name</th>
                            <th className="text-left py-4 px-6 text-xs uppercase text-gray-500 font-bold tracking-wider">Contact Info</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredParents.map((parent) => (
                            <tr key={parent.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="py-4 px-6">
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-mono">
                                        {parent.studentId}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center">
                                        <MdSchool className="w-5 h-5 mr-3 text-blue-500" />
                                        <span className="font-semibold text-gray-800">{parent.studentName}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-purple-700 font-bold text-sm">
                                                {parent.name.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                        <span className="font-medium text-gray-800">{parent.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center text-sm">
                                            <MdEmail className="w-4 h-4 mr-2 text-gray-400" />
                                            <a
                                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${parent.email}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {parent.email}
                                            </a>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MdPhone className="w-4 h-4 mr-2 text-gray-400" />
                                            {parent.phone}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-3">
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                />

                {/* Add Parent Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 shadow-sm transition-colors text-sm font-medium"
                >
                    <MdPersonAdd className="w-5 h-5 mr-2" /> Add Parent
                </button>

                {/* Import Excel Button */}
                <button
                    onClick={handleImportClick}
                    className="flex items-center bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 shadow-sm transition-colors text-sm font-medium"
                >
                    <MdFileUpload className="w-5 h-5 mr-2" /> Import from Excel
                </button>

                {/* Download Button */}
                <button className="flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium">
                    <MdFileDownload className="w-5 h-5 mr-2" /> Download List
                </button>
            </div>

            {/* Add Parent Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Add New Parent</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddParent} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newParent.studentName}
                                    onChange={(e) => setNewParent({ ...newParent, studentName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter student name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                                <input
                                    type="text"
                                    required
                                    value={newParent.studentId}
                                    onChange={(e) => setNewParent({ ...newParent, studentId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="U2024XXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newParent.parentName}
                                    onChange={(e) => setNewParent({ ...newParent, parentName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter parent name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newParent.email}
                                    onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="parent@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={newParent.phone}
                                    onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="+1 XXX-XXX-XXXX"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Parent
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Parents;
