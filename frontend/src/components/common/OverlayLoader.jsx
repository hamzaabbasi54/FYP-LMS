import React from 'react';
import { MdRefresh } from 'react-icons/md';

const OverlayLoader = ({ isLoading, text = 'Processing, please wait...' }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 max-w-sm w-full mx-4 transform scale-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative flex items-center justify-center w-16 h-16">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <MdRefresh className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Working on it</h3>
                    <p className="text-sm text-slate-500 font-medium animate-pulse">{text}</p>
                </div>
            </div>
        </div>
    );
};

export default OverlayLoader;
