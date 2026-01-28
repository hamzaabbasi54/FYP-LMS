import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddFaculty = () => {
    const navigate = useNavigate();

    // State to hold form data
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        contactNumber: '',
        dob: '',
        designation: '',
        department: '',
        joiningDate: '',
        expertise: '',
        bio: ''
    });

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Mock Submit Handler
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting Faculty Data:", formData);
        alert("Faculty member added successfully!");
        navigate('/admin-managefaculty'); // Go back to list after save
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">

                <form onSubmit={handleSubmit}>

                    {/* --- Section 1: Personal Information --- */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Personal Information</h3>
                        <p className="text-sm text-gray-500 mb-6">Enter the basic details of the new faculty member.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Dr. Jane Doe"
                                />
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. jane.doe@university.edu"
                                />
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                                <input
                                    type="text"
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. +1 (555) 123-4567"
                                />
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                        </div>
                    </div>

                    <hr className="my-8 border-gray-100" />

                    {/* --- Section 2: Professional Details --- */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Professional Details</h3>
                        <p className="text-sm text-gray-500 mb-6">Specify the faculty member's role and department.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Designation */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                                <select
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select Designation</option>
                                    <option value="Professor">Professor</option>
                                    <option value="Associate Professor">Associate Professor</option>
                                    <option value="Assistant Professor">Assistant Professor</option>
                                    <option value="Lecturer">Lecturer</option>
                                </select>
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Mathematics">Mathematics</option>
                                    <option value="Physics">Physics</option>
                                    <option value="Business">Business</option>
                                </select>
                            </div>

                            {/* Joining Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Joining Date</label>
                                <input
                                    type="date"
                                    name="joiningDate"
                                    value={formData.joiningDate}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Filler div to keep grid alignment if needed, or Areas of Expertise can go full width */}
                        </div>

                        {/* Areas of Expertise - Full Width */}
                        <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Areas of Expertise</label>
                            <input
                                type="text"
                                name="expertise"
                                value={formData.expertise}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Artificial Intelligence, Machine Learning"
                            />
                        </div>

                        {/* Short Biography - Full Width */}
                        <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Short Biography</label>
                            <textarea
                                rows="4"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="A brief professional summary..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate('/admin-managefaculty')} // Go back
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition-colors"
                        >
                            Submit
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddFaculty;