const initialSuppliers = [
  { id: "supplier-1", code: "مد - 1", name: "شركة النور للتوريدات", company: "النور للتجارة", item: "حديد تسليح", status: "مستلمة", debit: 5000, credit: 0 },
  { id: "supplier-2", code: "مد - 2", name: "مؤسسة الأفق", company: "الأفق الصناعية", item: "أسمنت", status: "قيد الانتظار", debit: 0, credit: 3000 },
  { id: "supplier-3", code: "مد - 3", name: "شركة الرواد", company: "الرواد للمقاولات", item: "خشب بناء", status: "مرفوضة", debit: 0, credit: 0 },
  { id: "supplier-4", code: "مد - 4", name: "مؤسسة السلام", company: "السلام للتجارة", item: "معدات كهربائية", status: "مستلمة", debit: 7000, credit: 0 },
  { id: "supplier-5", code: "مد - 5", name: "شركة المستقبل", company: "المستقبل للتوريدات", item: "أنابيب بلاستيك", status: "قيد الانتظار", debit: 0, credit: 2500 },
  { id: "supplier-6", code: "مد - 6", name: "شركة الاتحاد", company: "الاتحاد للمعدات", item: "دهانات", status: "مستلمة", debit: 4000, credit: 0 },
  { id: "supplier-7", code: "مد - 7", name: "مؤسسة البنيان", company: "البنيان للمقاولات", item: "زجاج واجهات", status: "مرفوضة", debit: 0, credit: 0 },
  { id: "supplier-8", code: "مد - 8", name: "شركة الرؤية", company: "الرؤية للتجارة", item: "رمل وزلط", status: "مستلمة", debit: 3500, credit: 0 },
  { id: "supplier-9", code: "مد - 9", name: "مؤسسة الطموح", company: "الطموح للتوريدات", item: "سيراميك", status: "قيد الانتظار", debit: 0, credit: 4200 },
  { id: "supplier-10", code: "مد - 10", name: "شركة الإتقان", company: "الإتقان للمعدات", item: "أدوات سباكة", status: "مستلمة", debit: 2800, credit: 0 }
];

const initialContractors = [
  { id: "contractor-1", code: "مل - 1", name: "المقاول العربي", company: "العربي للمقاولات", task: "أعمال حفر", invoiceNum: "101", status: "مستلم", debit: 6000, credit: 0, month: "مايو", year: 2026 },
  { id: "contractor-2", code: "مل - 2", name: "شركة البناء الحديث", company: "البناء الحديث", task: "صب خرسانة", invoiceNum: "102", status: "قيد الانتظار", debit: 0, credit: 4500, month: "مايو", year: 2026 },
  { id: "contractor-3", code: "مل - 3", name: "مؤسسة العمران", company: "العمران للمقاولات", task: "تركيب حديد تسليح", invoiceNum: "103", status: "مرفوض", debit: 0, credit: 0, month: "مايو", year: 2026 },
  { id: "contractor-4", code: "مل - 4", name: "شركة الريادة", company: "الريادة للبناء", task: "أعمال تشطيب", invoiceNum: "104", status: "مستلم", debit: 8000, credit: 0, month: "مايو", year: 2026 },
  { id: "contractor-5", code: "مل - 5", name: "المقاول المصري", company: "المصري للمقاولات", task: "تركيب سيراميك", invoiceNum: "105", status: "قيد الانتظار", debit: 0, credit: 3200, month: "مايو", year: 2026 },
  { id: "contractor-6", code: "مل - 6", name: "شركة الإعمار", company: "الإعمار للتشييد", task: "أعمال سباكة", invoiceNum: "106", status: "مستلم", debit: 5000, credit: 0, month: "مايو", year: 2026 },
  { id: "contractor-7", code: "مل - 7", name: "مؤسسة التعمير", company: "التعمير للمقاولات", task: "أعمال كهرباء", invoiceNum: "107", status: "مرفوض", debit: 0, credit: 0, month: "مايو", year: 2026 },
  { id: "contractor-8", code: "مل - 8", name: "شركة المستقبل", company: "المستقبل للبناء", task: "تركيب زجاج واجهات", invoiceNum: "108", status: "مستلم", debit: 4200, credit: 0, month: "مايو", year: 2026 },
  { id: "contractor-9", code: "مل - 9", name: "المقاول الدولي", company: "الدولي للمقاولات", task: "أعمال دهانات", invoiceNum: "109", status: "قيد الانتظار", debit: 0, credit: 3900, month: "مايو", year: 2026 },
  { id: "contractor-10", code: "مل - 10", name: "شركة الإتقان", company: "الإتقان للتشييد", task: "أعمال أرضيات", invoiceNum: "110", status: "مستلم", debit: 3600, credit: 0, month: "مايو", year: 2026 }
];

const initialEmployees = [
  { id: "emp-1", code: "مو-1", name: "أحمد علي", job: "مهندس مدني", netSalary: 8000, allowance: 1000, deduction: 500, bonus: 1200, month: "مايو", year: 2026 },
  { id: "emp-2", code: "مو-2", name: "محمد حسن", job: "محاسب", netSalary: 6000, allowance: 500, deduction: 300, bonus: 800, month: "مايو", year: 2026 },
  { id: "emp-3", code: "مو-3", name: "فاطمة محمود", job: "مهندسة معمارية", netSalary: 7500, allowance: 800, deduction: 400, bonus: 1000, month: "مايو", year: 2026 },
  { id: "emp-4", code: "مو-4", name: "خالد إبراهيم", job: "فني كهرباء", netSalary: 5000, allowance: 600, deduction: 200, bonus: 500, month: "مايو", year: 2026 },
  { id: "emp-5", code: "مو-5", name: "سارة عبد الله", job: "مسؤولة موارد بشرية", netSalary: 6500, allowance: 700, deduction: 300, bonus: 600, month: "مايو", year: 2026 },
  { id: "emp-6", code: "مو-6", name: "محمود يوسف", job: "مراقب موقع", netSalary: 5500, allowance: 400, deduction: 200, bonus: 400, month: "مايو", year: 2026 },
  { id: "emp-7", code: "مو-7", name: "ليلى أحمد", job: "مهندسة ميكانيكا", netSalary: 7200, allowance: 900, deduction: 500, bonus: 700, month: "مايو", year: 2026 },
  { id: "emp-8", code: "مو-8", name: "عمر عبد الرحمن", job: "مسؤول مشتريات", netSalary: 5800, allowance: 500, deduction: 300, bonus: 600, month: "مايو", year: 2026 },
  { id: "emp-9", code: "مو-9", name: "نورا محمد", job: "سكرتيرة تنفيذية", netSalary: 4800, allowance: 400, deduction: 200, bonus: 300, month: "مايو", year: 2026 },
  { id: "emp-10", code: "مو-10", name: "يوسف علي", job: "مدير مشروع", netSalary: 9000, allowance: 1200, deduction: 600, bonus: 1500, month: "مايو", year: 2026 }
];

const initialBudgets = {
  contractValue: 48500,
  supplierBudget: 48500,
  contractorBudget: 40000,
  employeeBudget: 85000
};

// Export to window object for browser access
window.initialSuppliers = initialSuppliers;
window.initialContractors = initialContractors;
window.initialEmployees = initialEmployees;
window.initialBudgets = initialBudgets;
