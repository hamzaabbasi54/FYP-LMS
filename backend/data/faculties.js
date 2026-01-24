// Faculties and their departments
// Dean manages a faculty, Department Admin manages a department within a faculty

export const faculties = {
    'Natural Sciences': [
        'Physics',
        'Chemistry',
        'Mathematics',
        'Environmental Science'
    ],
    'Social Sciences': [
        'Psychology',
        'Sociology',
        'Economics',
        'Political Science'
    ],
    'Medicine': [
        'General Medicine',
        'Surgery',
        'Pharmacy',
        'Nursing'
    ],
    'Biological Sciences': [
        'Biotechnology',
        'Microbiology',
        'Genetics',
        'Zoology'
    ]
};

// Get all faculty names
export const getFacultyNames = () => Object.keys(faculties);

// Get departments for a specific faculty
export const getDepartments = (facultyName) => faculties[facultyName] || [];

// Get all departments across all faculties
export const getAllDepartments = () => {
    const allDepts = [];
    Object.entries(faculties).forEach(([faculty, departments]) => {
        departments.forEach(dept => {
            allDepts.push({ faculty, department: dept });
        });
    });
    return allDepts;
};

// Find which faculty a department belongs to
export const getFacultyByDepartment = (departmentName) => {
    for (const [faculty, departments] of Object.entries(faculties)) {
        if (departments.includes(departmentName)) {
            return faculty;
        }
    }
    return null;
};

export default faculties;
