import React from 'react';
import { MdLanguage, MdLibraryBooks, MdEmail, MdSchool, MdPeople, MdHelp, MdOpenInNew } from 'react-icons/md';

const ExternalLinks = () => {
    const links = [
        {
            category: 'University Portal',
            icon: MdSchool,
            color: 'from-blue-500 to-violet-600',
            items: [
                { name: 'University Main Website', url: 'https://university.edu.pk', description: 'Official university website' },
                { name: 'Student Portal', url: 'https://portal.university.edu.pk', description: 'Access grades, transcripts, and records' },
                { name: 'Faculty Portal', url: 'https://faculty.university.edu.pk', description: 'Faculty resources and tools' },
            ]
        },
        {
            category: 'Library Resources',
            icon: MdLibraryBooks,
            color: 'from-emerald-500 to-teal-600',
            items: [
                { name: 'Digital Library', url: 'https://library.university.edu.pk', description: 'Access e-books and journals' },
                { name: 'IEEE Xplore', url: 'https://ieeexplore.ieee.org', description: 'Research papers and publications' },
                { name: 'ACM Digital Library', url: 'https://dl.acm.org', description: 'Computing research database' },
            ]
        },
        {
            category: 'Communication',
            icon: MdEmail,
            color: 'from-blue-500 to-cyan-600',
            items: [
                { name: 'University Email', url: 'https://mail.university.edu.pk', description: 'Official email system' },
                { name: 'Microsoft Teams', url: 'https://teams.microsoft.com', description: 'Virtual classrooms and meetings' },
                { name: 'Slack Workspace', url: 'https://university.slack.com', description: 'Department communication' },
            ]
        },
        {
            category: 'Student Services',
            icon: MdPeople,
            color: 'from-amber-500 to-orange-600',
            items: [
                { name: 'Career Services', url: 'https://careers.university.edu.pk', description: 'Job placements and internships' },
                { name: 'Counseling Center', url: 'https://counseling.university.edu.pk', description: 'Student support services' },
                { name: 'Financial Aid', url: 'https://finaid.university.edu.pk', description: 'Scholarships and financial assistance' },
            ]
        },
        {
            category: 'Academic Resources',
            icon: MdLanguage,
            color: 'from-purple-500 to-pink-600',
            items: [
                { name: 'Course Catalog', url: 'https://catalog.university.edu.pk', description: 'Browse all available courses' },
                { name: 'Academic Calendar', url: 'https://calendar.university.edu.pk', description: 'Important dates and deadlines' },
                { name: 'Examination Office', url: 'https://exams.university.edu.pk', description: 'Exam schedules and results' },
            ]
        },
        {
            category: 'Help & Support',
            icon: MdHelp,
            color: 'from-red-500 to-rose-600',
            items: [
                { name: 'IT Help Desk', url: 'https://helpdesk.university.edu.pk', description: 'Technical support and assistance' },
                { name: 'FAQ', url: 'https://faq.university.edu.pk', description: 'Frequently asked questions' },
                { name: 'Contact Directory', url: 'https://directory.university.edu.pk', description: 'Find staff and faculty contacts' },
            ]
        },
    ];

    return (
        <div className="h-[calc(100vh-96px)] bg-gradient-to-br from-slate-200/80 to-slate-300/80 rounded-3xl p-6 shadow-md border border-slate-300/60 overflow-y-auto flex flex-col space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">External Links</h1>
                <p className="text-slate-500 text-sm mt-1">Quick access to university resources and external services</p>
            </div>

            {/* Links Grid */}
            <div className="space-y-6">
                {links.map((category, idx) => {
                    const CategoryIcon = category.icon;
                    return (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Category Header */}
                            <div className={`bg-gradient-to-r ${category.color} p-4 flex items-center gap-3`}>
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <CategoryIcon className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-lg font-bold text-white">{category.category}</h2>
                            </div>

                            {/* Links */}
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {category.items.map((link, linkIdx) => (
                                    <a
                                        key={linkIdx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all bg-slate-50 hover:bg-white"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                {link.name}
                                            </h3>
                                            <MdOpenInNew className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                                        </div>
                                        <p className="text-sm text-slate-500">{link.description}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ExternalLinks;
