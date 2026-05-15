import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdEmail, MdSchool, MdCheckCircle } from 'react-icons/md';
import { authApi } from '../../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const validateEmail = (email) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        // Call the forgot password API
        setLoading(true);
        try {
            await authApi.forgotPassword(email);
            setIsSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) {
            setError('');
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-800 rounded-2xl mb-4">
                            <MdSchool className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">University LMS</h1>
                    </div>

                    {/* Success Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <MdCheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-3">Check Your Email</h2>
                            <p className="text-gray-600 mb-6">
                                We've sent a password reset link to <span className="font-semibold text-gray-800">{email}</span>
                            </p>
                            <p className="text-sm text-gray-500 mb-8">
                                Please check your inbox and click on the link to reset your password. The link will expire in 24 hours.
                            </p>
                            <Link
                                to="/"
                                className="inline-block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>

                    {/* Resend Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Didn't receive the email?{' '}
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                                Try again
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-800 rounded-2xl mb-4">
                        <MdSchool className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password?</h1>
                    <p className="text-gray-600">No worries, we'll send you reset instructions</p>
                </div>

                {/* Reset Password Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdEmail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                                />
                            </div>
                            {error && (
                                <p className="mt-1 text-sm text-red-600">{error}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        {/* Back to Login */}
                        <Link
                            to="/"
                            className="block text-center text-sm font-semibold text-gray-600 hover:text-gray-800 hover:underline"
                        >
                            Back to Login
                        </Link>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>&copy; 2026 University LMS. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
