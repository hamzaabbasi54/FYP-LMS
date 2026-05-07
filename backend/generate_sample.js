import XLSX from 'xlsx';

const data = [
    { title: 'Advanced Thermodynamics', code: 'PHY-401', department_name: 'Physics', credit_hours: 3, prerequisites: 'PHY-101', description: 'Advanced thermodynamic principles.' },
    { title: 'Molecular Genetics', code: 'GEN-302', department_name: 'Genetics', credit_hours: 4, prerequisites: 'GEN-201', description: 'Study of molecular structure of DNA.' },
    { title: 'Quantum Computing Basics', code: 'PHY-405', department_name: 'Physics', credit_hours: 3, prerequisites: 'PHY-301', description: 'Introduction to qubits and quantum gates.' }
];

const workbook = XLSX.utils.book_new();
const sheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, sheet, 'Courses');
XLSX.writeFile(workbook, 'sample_courses.xlsx');
console.log('Sample Excel file created at: sample_courses.xlsx');
