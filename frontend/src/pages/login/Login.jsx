import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import bgImage from '../../assets/484916933_1125377312721811_3180112978211178051_n.jpg';
import qauLogo from '../../assets/QAU-Logo.png';

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
            className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-4 relative"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            {/* Subtle Overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Login Card */}
                <div className="bg-white/20 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 border border-white/40">
                    {/* Logo and Header */}
                    <div className="text-center mb-6">
                        <img src={qauLogo} alt="University Logo" className="h-20 mx-auto mb-3 object-contain drop-shadow-md" />
                        <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-md">University LMS</h1>
                        <p className="text-white/80 text-sm font-medium">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2 drop-shadow-md">
                                Select Role
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm text-gray-900 font-medium"
                            >
                                <option value="super_admin">{roleLabels.super_admin}</option>
                                <option value="deptadmin">{roleLabels.deptadmin}</option>
                                <option value="faculty">{roleLabels.faculty}</option>
                            </select>
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2 drop-shadow-md">
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
                                    className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-white/40'} rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm placeholder-gray-600 text-gray-900 font-medium`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2 drop-shadow-md">
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
                                    className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-white/40'} rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-white/60 backdrop-blur-sm placeholder-gray-600 text-gray-900 font-medium`}
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
                                    className="w-4 h-4 text-blue-600 border-white/50 rounded focus:ring-blue-400 bg-white/40"
                                />
                                <span className="ml-2 text-sm font-medium text-white drop-shadow-md">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm font-semibold text-white hover:text-blue-200 hover:underline drop-shadow-md"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600/90 backdrop-blur-md border border-blue-400/50 text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>


                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-white/80 font-medium tracking-wide">
                    <p>&copy; 2026 Quaid-i-Azam University. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
