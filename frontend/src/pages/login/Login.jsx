import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import campusFlowLogo from '../../assets/campus-flow-logo-clean.svg';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'faculty',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const roleLabels = {
        super_admin: 'Super Admin',
        deptadmin: 'Department Admin',
        faculty: 'Faculty'
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setLoading(true);
            try {
                const data = await login(formData.email, formData.password, formData.role);

                if (data.success) {
                    // Redirect based on role
                    const redirectMap = {
                        super_admin: '/admin-dashboard',
                        deptadmin: '/deptadmin-dashboard',
                        faculty: '/faculty-dashboard'
                    };
                    navigate(redirectMap[data.data.role] || '/');
                } else {
                    setErrors({ password: data.message });
                }
            } catch (error) {
                console.error('Login error:', error);
                const errorMessage = error.response?.data?.message || 'Failed to login. Please try again.';
                setErrors({ password: errorMessage });
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div
            className="campus-login-shell h-screen max-h-screen flex flex-col items-center justify-center p-3 relative overflow-hidden"
        >
            <div className="campus-login-grid" aria-hidden="true"></div>
            <div className="campus-flow-line campus-flow-line-one" aria-hidden="true"></div>
            <div className="campus-flow-line campus-flow-line-two" aria-hidden="true"></div>
            <div className="campus-flow-line campus-flow-line-three" aria-hidden="true"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Login Card */}
                <div className="bg-white/82 backdrop-blur-2xl rounded-3xl shadow-[0_24px_80px_rgba(14,116,144,0.28)] p-6 sm:p-7 border border-white/70">
                    {/* Logo and Header */}
                    <div className="text-center mb-4">
                        <img src={campusFlowLogo} alt="Campus Flow Logo" className="h-24 sm:h-28 w-full mx-auto mb-1 object-contain drop-shadow-sm" />
                        <p className="text-slate-500 text-sm font-medium">One workspace for courses, attendance, and outcomes.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Select Role
                            </label>
                            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-sky-100 bg-white/70 p-1 shadow-sm">
                                {Object.entries(roleLabels).map(([roleValue, label]) => (
                                    <button
                                        key={roleValue}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, role: roleValue }))}
                                        className={`min-h-11 rounded-xl px-2 text-xs sm:text-sm font-semibold transition-all ${
                                            formData.role === roleValue
                                                ? 'bg-sky-600 text-white shadow-md shadow-sky-700/20'
                                                : 'text-slate-600 hover:bg-sky-50 hover:text-sky-800'
                                        }`}
                                        aria-pressed={formData.role === roleValue}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdEmail className="h-5 w-5 text-gray-600" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-sky-100'} rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-200 bg-white/90 placeholder-slate-400 text-slate-900 font-medium`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MdLock className="h-5 w-5 text-gray-600" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-sky-100'} rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-200 bg-white/90 placeholder-slate-400 text-slate-900 font-medium`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <MdVisibilityOff className="h-5 w-5 text-gray-600 hover:text-gray-800" />
                                    ) : (
                                        <MdVisibility className="h-5 w-5 text-gray-600 hover:text-gray-800" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-sky-600 border-sky-200 rounded focus:ring-sky-400 bg-white"
                                />
                                <span className="ml-2 text-sm font-medium text-slate-600">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-sky-600 border border-sky-500 text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 shadow-lg shadow-sky-700/20 hover:shadow-xl disabled:opacity-50"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>


                </div>

                {/* Footer */}
                <div className="mt-4 text-center text-sm text-slate-600 font-medium tracking-wide">
                    <p>&copy; 2026 Campus Flow. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
