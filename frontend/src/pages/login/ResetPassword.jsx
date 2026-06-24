import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    PiArrowLeft,
    PiCheckCircle,
    PiEye,
    PiEyeSlash,
    PiLockKey,
    PiWarningCircle
} from 'react-icons/pi';
import { authApi } from '../../services/api';
import campusFlowLogo from '../../assets/campus-flow-logo-clean.svg';

const ResetPasswordShell = ({ children }) => (
    <div className="campus-login-shell min-h-screen h-screen max-h-screen flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden">
        <div className="campus-login-grid" aria-hidden="true"></div>
        <div className="campus-flow-line campus-flow-line-one" aria-hidden="true"></div>
        <div className="campus-flow-line campus-flow-line-two" aria-hidden="true"></div>
        <div className="campus-flow-line campus-flow-line-three" aria-hidden="true"></div>
        {children}
    </div>
);

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

    const calculatePasswordStrength = (password) => {
        let score = 0;
        if (!password) return { score: 0, label: '', color: '' };

        // Length check
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;

        // Character variety checks
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        // Determine strength label and color
        if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
        return { score, label: 'Strong', color: 'bg-green-500' };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Update password strength for password field
        if (name === 'password') {
            setPasswordStrength(calculatePasswordStrength(value));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const data = await authApi.resetPassword(token, formData.password);
            if (data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/'), 3000);
            } else {
                setErrors({ password: data.message });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to reset password. The link may have expired.';
            setErrors({ password: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    // No token in URL
    if (!token) {
        return (
            <ResetPasswordShell>
                <div className="relative z-10 w-full max-w-md text-center">
                    <div className="bg-white/82 backdrop-blur-2xl rounded-3xl shadow-[0_24px_80px_rgba(14,116,144,0.28)] p-6 border border-white/70">
                        <img src={campusFlowLogo} alt="Campus Flow Logo" className="h-20 sm:h-24 w-full mx-auto mb-1 object-contain drop-shadow-sm" />
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 border border-red-100 rounded-2xl mb-4">
                            <PiWarningCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-950 mb-2">Invalid Reset Link</h1>
                        <p className="text-slate-600 mb-6">
                            This password reset link is invalid. Please request a new one from the login page.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="inline-flex w-full items-center justify-center gap-2 bg-sky-600 border border-sky-500 text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 shadow-lg shadow-sky-700/20 hover:shadow-xl"
                        >
                            Request New Link
                        </Link>
                    </div>
                </div>
            </ResetPasswordShell>
        );
    }

    // Success state
    if (success) {
        return (
            <ResetPasswordShell>
                <div className="relative z-10 w-full max-w-md text-center">
                    <div className="bg-white/82 backdrop-blur-2xl rounded-3xl shadow-[0_24px_80px_rgba(14,116,144,0.28)] p-6 border border-white/70">
                        <img src={campusFlowLogo} alt="Campus Flow Logo" className="h-20 sm:h-24 w-full mx-auto mb-1 object-contain drop-shadow-sm" />
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl mb-4">
                            <PiCheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-950 mb-2">Password Reset Successfully</h1>
                        <p className="text-slate-600 mb-6">
                            Your password has been updated. You will be redirected to the login page shortly.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex w-full items-center justify-center gap-2 bg-sky-600 border border-sky-500 text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 shadow-lg shadow-sky-700/20 hover:shadow-xl"
                        >
                            Login Now
                        </Link>
                    </div>
                </div>
            </ResetPasswordShell>
        );
    }

    return (
        <ResetPasswordShell>
            <div className="w-full max-w-[420px] relative z-10">
                <div className="bg-white/84 backdrop-blur-2xl rounded-3xl shadow-[0_24px_80px_rgba(14,116,144,0.28)] p-4 border border-white/75">
                    <div className="text-center mb-2.5">
                        <img src={campusFlowLogo} alt="Campus Flow Logo" className="h-16 sm:h-20 w-full mx-auto mb-2 object-contain drop-shadow-sm" />
                        <h1 className="text-xl sm:text-[1.35rem] font-bold text-slate-950">Reset Password</h1>
                        <p className="mt-1 text-slate-500 text-xs font-medium leading-snug">
                            Create a new secure password for your Campus Flow account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* New Password Input */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <PiLockKey className="h-5 w-5 text-gray-600" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    className={`w-full pl-10 pr-12 py-2.5 border ${errors.password ? 'border-red-500' : 'border-sky-100'} rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-200 bg-white/90 placeholder-slate-400 text-slate-900 font-medium text-sm`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <PiEyeSlash className="h-5 w-5 text-gray-500 hover:text-slate-700" />
                                    ) : (
                                        <PiEye className="h-5 w-5 text-gray-500 hover:text-slate-700" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-600">Password strength:</span>
                                        <span className={`text-xs font-semibold ${passwordStrength.label === 'Weak' ? 'text-red-600' :
                                                passwordStrength.label === 'Medium' ? 'text-yellow-600' :
                                                    'text-green-600'
                                            }`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="w-full bg-sky-50 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                            style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <PiLockKey className="h-5 w-5 text-gray-600" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    className={`w-full pl-10 pr-12 py-2.5 border ${errors.confirmPassword ? 'border-red-500' : 'border-sky-100'} rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-200 bg-white/90 placeholder-slate-400 text-slate-900 font-medium text-sm`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? (
                                        <PiEyeSlash className="h-5 w-5 text-gray-500 hover:text-slate-700" />
                                    ) : (
                                        <PiEye className="h-5 w-5 text-gray-500 hover:text-slate-700" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Password Requirements */}
                        <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3">
                            <p className="text-[11px] font-bold text-slate-700 mb-2 uppercase tracking-[0.16em]">Password must contain</p>
                            <ul className="text-[11px] text-slate-600 grid grid-cols-2 gap-x-2 gap-y-1">
                                <li className="flex items-center">
                                    <PiCheckCircle className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${formData.password.length >= 6 ? 'text-emerald-500' : 'text-slate-300'}`} />
                                    At least 6 characters
                                </li>
                                <li className="flex items-center">
                                    <PiCheckCircle className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${/[A-Z]/.test(formData.password) ? 'text-emerald-500' : 'text-slate-300'}`} />
                                    One uppercase letter
                                </li>
                                <li className="flex items-center">
                                    <PiCheckCircle className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${/[a-z]/.test(formData.password) ? 'text-emerald-500' : 'text-slate-300'}`} />
                                    One lowercase letter
                                </li>
                                <li className="flex items-center">
                                    <PiCheckCircle className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 ${/[0-9]/.test(formData.password) ? 'text-emerald-500' : 'text-slate-300'}`} />
                                    One number
                                </li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center gap-2 bg-sky-600 border border-sky-500 text-white py-2.5 rounded-xl font-bold tracking-wide hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 shadow-lg shadow-sky-700/20 hover:shadow-xl disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        {/* Back to Login */}
                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-slate-600 hover:text-sky-800 hover:underline"
                        >
                            <PiArrowLeft className="h-4 w-4" />
                            Back to Login
                        </Link>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-3 text-center text-xs sm:text-sm text-slate-600 font-medium tracking-wide">
                    <p>&copy; 2026 Campus Flow. All rights reserved.</p>
                </div>
            </div>
        </ResetPasswordShell>
    );
};

export default ResetPassword;
