import React, { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdFileDownload, MdFileUpload, MdPersonAdd, MdClose, MdEmail } from 'react-icons/md';

const StudentList = () => {
    const { id } = useParams();
    const fileInputRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newStudent, setNewStudent] = useState({
        name: '',
        email: '',
        studentId: '',
        contact: '',
        cgpa: ''
    });

    const students = [
        { id: 'U2024001', name: 'Alice Johnson', email: 'alice.j@university.edu', contact: '+1 123-456-7890', cgpa: '3.85' },
        { id: 'U2024002', name: 'Bob Williams', email: 'bob.w@university.edu', contact: '+1 234-567-0981', cgpa: '3.50' },
        { id: 'U2024003', name: 'Charlie Brown', email: 'charlie.b@university.edu', contact: '+1 865-674-0012', cgpa: '3.02' },
        { id: 'U2024004', name: 'Diana Miller', email: 'diana.m@university.edu', contact: '+1 456-789-0123', cgpa: '3.71' },
        { id: 'U2024005', name: 'Ethan Davis', email: 'ethan.d@university.edu', contact: '+1 567-890-1234', cgpa: '2.64' },
        { id: 'U2024006', name: 'Fiona Garcia', email: 'fiona.g@university.edu', contact: '+1 678-901-2345', cgpa: '3.98' },
    ];

    const filteredStudents = students.filter((student) => {
        const query = searchQuery.toLowerCase();
        return (
            student.name.toLowerCase().includes(query) ||
            student.id.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query)
        );
    });

    const handleAddStudent = (e) => {
        e.preventDefault();
        alert(`Student "${newStudent.name}" added successfully!`);
        setShowAddModal(false);
        setNewStudent({ name: '', email: '', studentId: '', contact: '', cgpa: '' });
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) alert(`File "${file.name}" selected. Import coming soon.`);
        e.target.value = '';
    };

    const getCgpaColor = (cgpa) => {
        const value = parseFloat(cgpa);
        if (value >= 3.5) return 'from-emerald-500 to-teal-600';
        if (value >= 3.0) return 'from-blue-500 to-indigo-600';
        if (value >= 2.5) return 'from-amber-500 to-orange-600';
        return 'from-red-500 to-rose-600';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="p-8 max-w-7xl mx-auto">

                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link to={`/admin-managebatches/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm">
                        <MdArrowBack className="w-4 h-4" /> Back to Batch Details
                    </Link>
                </div>

                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Students
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-5 mt-1">Computer Science 2024 • {students.length} students enrolled</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />

                        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                            <MdPersonAdd className="w-5 h-5" /> Add
                        </button>
                        <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all">
                            <MdFileUpload className="w-5 h-5 text-emerald-500" /> Import
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all">
                            <MdFileDownload className="w-5 h-5 text-blue-500" /> Export
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Student</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">ID</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">Contact</th>
                                    <th className="text-left py-4 px-6 text-xs uppercase text-slate-400 font-semibold tracking-wider">CGPA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                                    <span className="text-slate-600 font-bold text-sm">
                                                        {student.name.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{student.name}</p>
                                                    <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${student.email}`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">
                                                        <MdEmail className="w-3 h-3" /> {student.email}
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-mono">{student.id}</span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-500">{student.contact}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-lg text-white text-sm font-bold bg-gradient-to-r ${getCgpaColor(student.cgpa)}`}>
                                                {student.cgpa}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            {searchQuery ? `Found ${filteredStudents.length} results` : `Showing ${students.length} students`}
                        </p>
                    </div>
                </div>

                {/* Add Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <h3 className="text-lg font-bold text-slate-800">Add New Student</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <MdClose className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddStudent} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                    <input type="text" required value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Enter name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                    <input type="email" required value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="student@university.edu" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Student ID</label>
                                    <input type="text" required value={newStudent.studentId} onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="U2024XXX" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact</label>
                                        <input type="tel" value={newStudent.contact} onChange={(e) => setNewStudent({ ...newStudent, contact: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="+1 XXX-XXX" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">CGPA</label>
                                        <input type="number" step="0.01" min="0" max="4" value={newStudent.cgpa} onChange={(e) => setNewStudent({ ...newStudent, cgpa: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium">Add Student</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentList;
