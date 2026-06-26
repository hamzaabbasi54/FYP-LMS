import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PiArrowLeft, PiCheckCircle, PiEnvelopeSimple, PiPaperPlaneTilt } from 'react-icons/pi';
import { authApi } from '../../services/api';
import campusFlowLogo from '../../assets/campus-flow-logo-clean.svg';

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
            <div className="campus-login-shell h-screen max-h-screen flex flex-col items-center justify-center p-3 relative overflow-hidden">
                <div className="campus-login-grid" aria-hidden="true"></div>
                <div className="campus-flow-line campus-flow-line-one" aria-hidden="true"></div>
                <div className="campus-flow-line campus-flow-line-two" aria-hidden="true"></div>
                <div className="campus-flow-line campus-flow-line-three" aria-hidden="true"></div>

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-white/82 backdrop-blur-2xl rounded-3xl shadow-[0_24px_80px_rgba(14,116,144,0.28)] p-6 sm:p-7 border border-white/70">
                        <div className="text-center mb-4">
                            <img src={campusFlowLogo} alt="Campus Flow Logo" className="h-24 sm:h-28 w-full mx-auto mb-1 object-contain drop-shadow-sm" />
                        </div>
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-50 border border-sky-100 rounded-2xl mb-4">
                                <PiCheckCircle className="w-10 h-10 text-sky-700" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-950 mb-3">Check Your Email</h2>
                            <p className="text-slate-600 mb-6">
                                We've sent a password reset link to <span className="font-semibold text-slate-900">{email}</span>
                            </p>
                            <p className="text-sm text-slate-500 mb-8">
                                Please check your inbox and click on the link to reset your password. The link will expire in 24 hours.
                            </p>
                            <Link
                                to="/"
                                className="inline-flex w-full items-center justify-center gap-2 bg-sky-600 border border-sky-500 text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 shadow-lg shadow-sky-700/20 hover:shadow-xl"
                            >
                                <PiArrowLeft className="h-5 w-5" />
                                Back to Login
                            </Link>
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-sm font-medium text-slate-600">
                            Didn't receive the email?{' '}
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="font-semibold text-sky-700 hover:text-sky-900 hover:underline"
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
        <div className="campus-login-shell h-screen max-h-screen flex flex-col items-center justify-center p-3 relative overflow-hidden">
            <div className="campus-login-grid" aria-hidden="true"></div>
            <div className="campus-flow-line campus-flow-line-one" aria-hidden="true"></div>
            <div className="campus-flow-line campus-flow-line-two" aria-hidden="true"></div>
            <div className="campus-flow-line campus-flow-line-three" aria-hidden="true"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/82 backdrop-blur-2xl rounded-3xl shadow-[0_24px_80px_rgba(14,116,144,0.28)] p-6 sm:p-7 border border-white/70">
                    <div className="text-center mb-4">
                        <img src={campusFlowLogo} alt="Campus Flow Logo" className="h-24 sm:h-28 w-full mx-auto mb-1 object-contain drop-shadow-sm" />
                        <h1 className="text-2xl font-bold text-slate-950">Forgot Password?</h1>
                        <p className="mt-2 text-slate-500 text-sm font-medium">No worries, we'll send reset instructions.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <PiEnvelopeSimple className="h-5 w-5 text-gray-600" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500' : 'border-sky-100'} rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-200 bg-white/90 placeholder-slate-400 text-slate-900 font-medium`}
                                />
                            </div>
                            {error && (
                                <p className="mt-1 text-sm text-red-600">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center gap-2 bg-sky-600 border border-sky-500 text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 shadow-lg shadow-sky-700/20 hover:shadow-xl disabled:opacity-50"
                        >
                            <PiPaperPlaneTilt className="h-5 w-5" />
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-600 hover:text-sky-800 hover:underline"
                        >
                            <PiArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </form>
                </div>

                <div className="mt-4 text-center text-sm text-slate-600 font-medium tracking-wide">
                    <p>&copy; 2026 Campus Flow. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
