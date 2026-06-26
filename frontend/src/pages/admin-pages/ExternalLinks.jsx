import React from 'react';
import {
    PiBooks,
    PiChatsCircle,
    PiGlobeHemisphereWest,
    PiGraduationCap,
    PiLifebuoy,
    PiLinkSimple,
    PiArrowSquareOut,
    PiStudent
} from 'react-icons/pi';

const ExternalLinks = () => {
    const links = [
        {
            category: 'University Portal',
            icon: PiGraduationCap,
            items: [
                { name: 'University Main Website', url: 'https://university.edu.pk', description: 'Official university website' },
                { name: 'Student Portal', url: 'https://portal.university.edu.pk', description: 'Access grades, transcripts, and records' },
                { name: 'Faculty Portal', url: 'https://faculty.university.edu.pk', description: 'Faculty resources and tools' },
            ]
        },
        {
            category: 'Library Resources',
            icon: PiBooks,
            items: [
                { name: 'Digital Library', url: 'https://library.university.edu.pk', description: 'Access e-books and journals' },
                { name: 'IEEE Xplore', url: 'https://ieeexplore.ieee.org', description: 'Research papers and publications' },
                { name: 'ACM Digital Library', url: 'https://dl.acm.org', description: 'Computing research database' },
            ]
        },
        {
            category: 'Communication',
            icon: PiChatsCircle,
            items: [
                { name: 'University Email', url: 'https://mail.university.edu.pk', description: 'Official email system' },
                { name: 'Microsoft Teams', url: 'https://teams.microsoft.com', description: 'Virtual classrooms and meetings' },
                { name: 'Slack Workspace', url: 'https://university.slack.com', description: 'Department communication' },
            ]
        },
        {
            category: 'Student Services',
            icon: PiStudent,
            items: [
                { name: 'Career Services', url: 'https://careers.university.edu.pk', description: 'Job placements and internships' },
                { name: 'Counseling Center', url: 'https://counseling.university.edu.pk', description: 'Student support services' },
                { name: 'Financial Aid', url: 'https://finaid.university.edu.pk', description: 'Scholarships and financial assistance' },
            ]
        },
        {
            category: 'Academic Resources',
            icon: PiGlobeHemisphereWest,
            items: [
                { name: 'Course Catalog', url: 'https://catalog.university.edu.pk', description: 'Browse all available courses' },
                { name: 'Academic Calendar', url: 'https://calendar.university.edu.pk', description: 'Important dates and deadlines' },
                { name: 'Examination Office', url: 'https://exams.university.edu.pk', description: 'Exam schedules and results' },
            ]
        },
        {
            category: 'Help & Support',
            icon: PiLifebuoy,
            items: [
                { name: 'IT Help Desk', url: 'https://helpdesk.university.edu.pk', description: 'Technical support and assistance' },
                { name: 'FAQ', url: 'https://faq.university.edu.pk', description: 'Frequently asked questions' },
                { name: 'Contact Directory', url: 'https://directory.university.edu.pk', description: 'Find staff and faculty contacts' },
            ]
        },
    ];

    return (
        <div className="min-h-[calc(100vh-116px)]">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/82 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.12)] backdrop-blur-2xl lg:p-7">
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Campus Flow</p>
                        <h1 className="mt-3 text-3xl font-bold text-slate-950">External Links</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Quick access to academic portals, library tools, communication services, and student support resources.
                        </p>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {links.map((category) => {
                        const CategoryIcon = category.icon;
                        return (
                            <section key={category.category} className="overflow-hidden rounded-3xl border border-sky-100 bg-white/92 shadow-sm">
                                <div className="flex items-center gap-3 border-b border-sky-100 bg-sky-50/70 p-5">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-100 bg-white text-sky-700 shadow-sm">
                                        <CategoryIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Resource Group</p>
                                        <h2 className="text-lg font-bold text-slate-950">{category.category}</h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                                    {category.items.map((link) => (
                                        <a
                                            key={link.name}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group rounded-2xl border border-sky-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/35 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-sky-100"
                                        >
                                            <div className="mb-2 flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <PiLinkSimple className="h-4 w-4 text-sky-700" />
                                                    <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-sky-700">
                                                        {link.name}
                                                    </h3>
                                                </div>
                                                <PiArrowSquareOut className="h-4 w-4 flex-shrink-0 text-slate-400 transition-colors group-hover:text-sky-700" />
                                            </div>
                                            <p className="text-sm leading-6 text-slate-500">{link.description}</p>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ExternalLinks;
