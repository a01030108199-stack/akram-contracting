// Register Service Worker for PWA (Desktop App Installation)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker Registered successfully'))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}

// Global State Object
let state = {
  suppliers: [],
  contractors: [],
  employees: [],
  budgets: {
    contractValue: 0,
    supplierBudget: 0,
    contractorBudget: 0,
    employeeBudget: 0
  },
  theme: "dark"
};

// Chart.js references
let barChart = null;
let pieChart = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadData();
  setupNavigation();
  initCharts();
  renderAll();
  
  // Search & Filter event listeners
  document.getElementById("searchSupplier").addEventListener("input", renderSuppliers);
  document.getElementById("filterSupplierStatus").addEventListener("change", renderSuppliers);
  
  document.getElementById("searchContractor").addEventListener("input", renderContractors);
  document.getElementById("filterContractorStatus").addEventListener("change", renderContractors);
  
  document.getElementById("searchEmployee").addEventListener("input", renderEmployees);
  document.getElementById("filterEmployeeMonth").addEventListener("change", renderEmployees);
});

// ==========================================
// STATE MANAGEMENT & LOCAL STORAGE
// ==========================================

function loadData() {
  const localData = localStorage.getItem("contracting_system_data");
  if (localData) {
    try {
      state = JSON.parse(localData);
    } catch (e) {
      console.error("Error parsing localStorage data, using defaults.");
      useDefaultData();
    }
  } else {
    useDefaultData();
  }
}

function saveData() {
  localStorage.setItem("contracting_system_data", JSON.stringify(state));
}

function useDefaultData() {
  state.suppliers = [...window.initialSuppliers];
  state.contractors = [...window.initialContractors];
  state.employees = [...window.initialEmployees];
  state.budgets = { ...window.initialBudgets };
  state.theme = localStorage.getItem("theme") || "dark";
  saveData();
}

// ==========================================
// NAVIGATION & THEME SWITCHER
// ==========================================

function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".app-section");

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = item.getAttribute("data-tab");
      
      navItems.forEach(nav => nav.classList.remove("active"));
      sections.forEach(sec => sec.classList.remove("active"));
      
      item.classList.add("active");
      document.getElementById(tabName).classList.add("active");

      // Specific tab load actions
      if (tabName === "dashboard") {
        updateDashboard();
      } else if (tabName === "statement") {
        populateStatementDropdown();
        loadStatement();
      }
    });
  });
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  state.theme = savedTheme;
  document.body.setAttribute("data-theme", savedTheme);
  updateThemeButtonUI();
}

function updateThemeButtonUI() {
  const btn = document.getElementById("themeToggleBtn");
  if (state.theme === "light") {
    btn.innerHTML = `<i class="fa-solid fa-moon"></i><span>الوضع الداكن</span>`;
  } else {
    btn.innerHTML = `<i class="fa-solid fa-sun"></i><span>الوضع الفاتح</span>`;
  }
}

document.getElementById("themeToggleBtn").addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  
  state.theme = newTheme;
  document.body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  
  updateThemeButtonUI();
  saveData();
  
  // Re-render charts with correct theme text colors
  if (barChart && pieChart) {
    initCharts();
  }
});

// ==========================================
// RENDER & COMPUTATION LOGIC
// ==========================================

function renderAll() {
  updateDashboard();
  renderSuppliers();
  renderContractors();
  renderEmployees();
  populateStatementDropdown();
}

function updateDashboard() {
  // Compute totals
  const totalSuppliersSpent = state.suppliers.reduce((sum, item) => sum + Number(item.debit) + Number(item.credit), 0);
  const totalContractorsSpent = state.contractors.reduce((sum, item) => sum + Number(item.debit) + Number(item.credit), 0);
  const totalEmployeesSpent = state.employees.reduce((sum, item) => {
    const empTotal = Number(item.netSalary) + Number(item.allowance) + Number(item.bonus) - Number(item.deduction);
    return sum + empTotal;
  }, 0);
  
  const totalActualSpent = totalSuppliersSpent + totalContractorsSpent + totalEmployeesSpent;
  const totalBudget = Number(state.budgets.supplierBudget) + Number(state.budgets.contractorBudget) + Number(state.budgets.employeeBudget);
  const variance = totalBudget - totalActualSpent;
  const liquidRemaining = Number(state.budgets.contractValue) - totalActualSpent;
  
  // Write to DOM
  document.getElementById("kpiContractValue").innerText = formatCurrency(state.budgets.contractValue);
  document.getElementById("kpiTotalBudget").innerText = formatCurrency(totalBudget);
  document.getElementById("kpiActualSpent").innerText = formatCurrency(totalActualSpent);
  
  const varEl = document.getElementById("kpiVariance");
  varEl.innerText = formatCurrency(variance);
  const varCard = varEl.closest(".kpi-card");
  if (variance < 0) {
    varCard.className = "glass-card kpi-card danger-kpi danger-border";
    document.getElementById("varianceIcon").innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
  } else {
    varCard.className = "glass-card kpi-card success-kpi success-border";
    document.getElementById("varianceIcon").innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i>`;
  }
  
  const liqEl = document.getElementById("kpiLiquidRemaining");
  liqEl.innerText = formatCurrency(liquidRemaining);
  const liqCard = liqEl.closest(".kpi-card");
  if (liquidRemaining < 0) {
    liqCard.className = "glass-card kpi-card danger-kpi danger-border";
    document.getElementById("liquidIcon").innerHTML = `<i class="fa-solid fa-circle-down"></i>`;
  } else {
    liqCard.className = "glass-card kpi-card warning-kpi warning-border";
    document.getElementById("liquidIcon").innerHTML = `<i class="fa-solid fa-hand-holding-usd"></i>`;
  }
  
  // Update Charts
  updateChartsData(
    [state.budgets.supplierBudget, state.budgets.contractorBudget, state.budgets.employeeBudget],
    [totalSuppliersSpent, totalContractorsSpent, totalEmployeesSpent]
  );
}

// ------------------------------------------
// SUPPLIERS CRUD & TABLE RENDER
// ------------------------------------------

function renderSuppliers() {
  const tbody = document.getElementById("supplierTableBody");
  const searchQuery = document.getElementById("searchSupplier").value.toLowerCase();
  const filterStatus = document.getElementById("filterSupplierStatus").value;
  
  tbody.innerHTML = "";
  
  let filtered = state.suppliers.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery) || 
                          item.company.toLowerCase().includes(searchQuery) || 
                          item.item.toLowerCase().includes(searchQuery) ||
                          item.code.toLowerCase().includes(searchQuery);
    const matchesStatus = filterStatus === "" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  
  let totalDebit = 0;
  let totalCredit = 0;
  
  filtered.forEach(item => {
    totalDebit += Number(item.debit);
    totalCredit += Number(item.credit);
    
    let statusClass = "badge-warning";
    if (item.status === "مستلمة") statusClass = "badge-success";
    if (item.status === "مرفوضة") statusClass = "badge-danger";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.code}</td>
      <td class="font-semibold">${item.name}</td>
      <td>${item.company}</td>
      <td>${item.item}</td>
      <td><span class="badge ${statusClass}">${item.status}</span></td>
      <td>${formatNumber(item.debit)}</td>
      <td>${formatNumber(item.credit)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-btn" onclick="editSupplier('${item.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete-btn" onclick="deleteSupplier('${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Render Summary Row
  const summaryRow = document.getElementById("supplierTableSummary");
  summaryRow.innerHTML = `
    <td colspan="5">الإجمالي</td>
    <td>${formatNumber(totalDebit)}</td>
    <td>${formatNumber(totalCredit)}</td>
    <td></td>
  `;
}

function openSupplierModal(id = null) {
  const form = document.getElementById("supplierForm");
  form.reset();
  
  if (id) {
    const item = state.suppliers.find(s => s.id === id);
    document.getElementById("supplierId").value = item.id;
    document.getElementById("supCode").value = item.code;
    document.getElementById("supName").value = item.name;
    document.getElementById("supCompany").value = item.company;
    document.getElementById("supItem").value = item.item;
    document.getElementById("supStatus").value = item.status;
    document.getElementById("supDebit").value = item.debit;
    document.getElementById("supCredit").value = item.credit;
    
    document.getElementById("supplierModalTitle").innerText = "تعديل فاتورة مورد";
    document.getElementById("supplierFormBtn").innerText = "تعديل البيانات";
  } else {
    document.getElementById("supplierId").value = "";
    document.getElementById("supCode").value = "مد - " + (state.suppliers.length + 1);
    document.getElementById("supplierModalTitle").innerText = "إضافة فاتورة مورد";
    document.getElementById("supplierFormBtn").innerText = "إضافة فاتورة";
  }
  
  openModal("supplierModal");
}

function saveSupplier(event) {
  event.preventDefault();
  
  const id = document.getElementById("supplierId").value;
  const newItem = {
    id: id || "supplier-" + Date.now(),
    code: document.getElementById("supCode").value,
    name: document.getElementById("supName").value,
    company: document.getElementById("supCompany").value,
    item: document.getElementById("supItem").value,
    status: document.getElementById("supStatus").value,
    debit: parseFloat(document.getElementById("supDebit").value) || 0,
    credit: parseFloat(document.getElementById("supCredit").value) || 0
  };
  
  if (id) {
    // Edit existing
    const idx = state.suppliers.findIndex(s => s.id === id);
    state.suppliers[idx] = newItem;
  } else {
    // Add new
    state.suppliers.push(newItem);
  }
  
  saveData();
  closeModal("supplierModal");
  renderAll();
}

function deleteSupplier(id) {
  if (confirm("هل أنت متأكد من رغبتك في حذف هذا الطلب؟")) {
    state.suppliers = state.suppliers.filter(s => s.id !== id);
    saveData();
    renderAll();
  }
}

// ------------------------------------------
// CONTRACTORS CRUD & TABLE RENDER
// ------------------------------------------

function renderContractors() {
  const tbody = document.getElementById("contractorTableBody");
  const searchQuery = document.getElementById("searchContractor").value.toLowerCase();
  const filterStatus = document.getElementById("filterContractorStatus").value;
  
  tbody.innerHTML = "";
  
  let filtered = state.contractors.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery) || 
                          item.company.toLowerCase().includes(searchQuery) || 
                          item.task.toLowerCase().includes(searchQuery) ||
                          item.code.toLowerCase().includes(searchQuery);
    const matchesStatus = filterStatus === "" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  
  let totalDebit = 0;
  let totalCredit = 0;
  let totalPaid = 0;
  
  filtered.forEach(item => {
    const totalRowPaid = Number(item.debit) + Number(item.credit);
    totalDebit += Number(item.debit);
    totalCredit += Number(item.credit);
    totalPaid += totalRowPaid;
    
    let statusClass = "badge-warning";
    if (item.status === "مستلم") statusClass = "badge-success";
    if (item.status === "مرفوض") statusClass = "badge-danger";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.code}</td>
      <td class="font-semibold">${item.name}</td>
      <td>${item.company}</td>
      <td>${item.task}</td>
      <td>${item.invoiceNum}</td>
      <td><span class="badge ${statusClass}">${item.status}</span></td>
      <td>${formatNumber(item.debit)}</td>
      <td>${formatNumber(item.credit)}</td>
      <td class="font-semibold" style="color: var(--primary);">${formatNumber(totalRowPaid)}</td>
      <td>${item.month || "مايو"}</td>
      <td>${item.year || 2026}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-btn" onclick="editContractor('${item.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete-btn" onclick="deleteContractor('${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  const summaryRow = document.getElementById("contractorTableSummary");
  summaryRow.innerHTML = `
    <td colspan="6">الإجمالي</td>
    <td>${formatNumber(totalDebit)}</td>
    <td>${formatNumber(totalCredit)}</td>
    <td style="color: var(--primary); font-weight:800;">${formatNumber(totalPaid)}</td>
    <td colspan="3"></td>
  `;
}

function openContractorModal(id = null) {
  const form = document.getElementById("contractorForm");
  form.reset();
  
  if (id) {
    const item = state.contractors.find(c => c.id === id);
    document.getElementById("contractorId").value = item.id;
    document.getElementById("conCode").value = item.code;
    document.getElementById("conName").value = item.name;
    document.getElementById("conCompany").value = item.company;
    document.getElementById("conTask").value = item.task;
    document.getElementById("conInvoiceNum").value = item.invoiceNum;
    document.getElementById("conStatus").value = item.status;
    document.getElementById("conDebit").value = item.debit;
    document.getElementById("conCredit").value = item.credit;
    document.getElementById("conMonth").value = item.month || "مايو";
    document.getElementById("conYear").value = item.year || 2026;
    
    document.getElementById("contractorModalTitle").innerText = "تعديل مستخلص مقاول";
    document.getElementById("contractorFormBtn").innerText = "تعديل البيانات";
  } else {
    document.getElementById("contractorId").value = "";
    document.getElementById("conCode").value = "مل - " + (state.contractors.length + 1);
    document.getElementById("contractorModalTitle").innerText = "إضافة مستخلص مقاول";
    document.getElementById("contractorFormBtn").innerText = "إضافة مستخلص";
  }
  
  openModal("contractorModal");
}

function saveContractor(event) {
  event.preventDefault();
  
  const id = document.getElementById("contractorId").value;
  const newItem = {
    id: id || "contractor-" + Date.now(),
    code: document.getElementById("conCode").value,
    name: document.getElementById("conName").value,
    company: document.getElementById("conCompany").value,
    task: document.getElementById("conTask").value,
    invoiceNum: document.getElementById("conInvoiceNum").value,
    status: document.getElementById("conStatus").value,
    debit: parseFloat(document.getElementById("conDebit").value) || 0,
    credit: parseFloat(document.getElementById("conCredit").value) || 0,
    month: document.getElementById("conMonth").value,
    year: parseInt(document.getElementById("conYear").value) || 2026
  };
  
  if (id) {
    const idx = state.contractors.findIndex(c => c.id === id);
    state.contractors[idx] = newItem;
  } else {
    state.contractors.push(newItem);
  }
  
  saveData();
  closeModal("contractorModal");
  renderAll();
}

function deleteContractor(id) {
  if (confirm("هل أنت متأكد من رغبتك في حذف هذا المستخلص؟")) {
    state.contractors = state.contractors.filter(c => c.id !== id);
    saveData();
    renderAll();
  }
}

// ------------------------------------------
// EMPLOYEES CRUD & TABLE RENDER
// ------------------------------------------

function renderEmployees() {
  const tbody = document.getElementById("employeeTableBody");
  const searchQuery = document.getElementById("searchEmployee").value.toLowerCase();
  const filterMonth = document.getElementById("filterEmployeeMonth").value;
  
  tbody.innerHTML = "";
  
  let filtered = state.employees.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery) || 
                          item.job.toLowerCase().includes(searchQuery) ||
                          item.code.toLowerCase().includes(searchQuery);
    const matchesMonth = filterMonth === "" || item.month === filterMonth;
    return matchesSearch && matchesMonth;
  });
  
  let sumNet = 0;
  let sumAllowance = 0;
  let sumDeduction = 0;
  let sumBonus = 0;
  let sumTotalSpent = 0;
  
  filtered.forEach(item => {
    const totalRow = Number(item.netSalary) + Number(item.allowance) - Number(item.deduction) + Number(item.bonus);
    sumNet += Number(item.netSalary);
    sumAllowance += Number(item.allowance);
    sumDeduction += Number(item.deduction);
    sumBonus += Number(item.bonus);
    sumTotalSpent += totalRow;
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.code}</td>
      <td class="font-semibold">${item.name}</td>
      <td>${item.job}</td>
      <td>${formatNumber(item.netSalary)}</td>
      <td>${formatNumber(item.allowance)}</td>
      <td>${formatNumber(item.deduction)}</td>
      <td>${formatNumber(item.bonus)}</td>
      <td class="font-semibold" style="color: var(--primary);">${formatNumber(totalRow)}</td>
      <td>${item.month || "مايو"}</td>
      <td>${item.year || 2026}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-btn" onclick="editEmployee('${item.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete-btn" onclick="deleteEmployee('${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  const summaryRow = document.getElementById("employeeTableSummary");
  summaryRow.innerHTML = `
    <td colspan="3">الإجمالي</td>
    <td>${formatNumber(sumNet)}</td>
    <td>${formatNumber(sumAllowance)}</td>
    <td>${formatNumber(sumDeduction)}</td>
    <td>${formatNumber(sumBonus)}</td>
    <td style="color: var(--primary); font-weight:800;">${formatNumber(sumTotalSpent)}</td>
    <td colspan="3"></td>
  `;
}

function openEmployeeModal(id = null) {
  const form = document.getElementById("employeeForm");
  form.reset();
  
  if (id) {
    const item = state.employees.find(e => e.id === id);
    document.getElementById("employeeId").value = item.id;
    document.getElementById("empCode").value = item.code;
    document.getElementById("empName").value = item.name;
    document.getElementById("empJob").value = item.job;
    document.getElementById("empNetSalary").value = item.netSalary;
    document.getElementById("empAllowance").value = item.allowance;
    document.getElementById("empDeduction").value = item.deduction;
    document.getElementById("empBonus").value = item.bonus;
    document.getElementById("empMonth").value = item.month || "مايو";
    document.getElementById("empYear").value = item.year || 2026;
    
    document.getElementById("employeeModalTitle").innerText = "تعديل رواتب موظف";
    document.getElementById("employeeFormBtn").innerText = "تعديل البيانات";
  } else {
    document.getElementById("employeeId").value = "";
    document.getElementById("empCode").value = "مو-" + (state.employees.length + 1);
    document.getElementById("employeeModalTitle").innerText = "إضافة موظف جديد";
    document.getElementById("employeeFormBtn").innerText = "إضافة موظف";
  }
  
  openModal("employeeModal");
}

function saveEmployee(event) {
  event.preventDefault();
  
  const id = document.getElementById("employeeId").value;
  const newItem = {
    id: id || "emp-" + Date.now(),
    code: document.getElementById("empCode").value,
    name: document.getElementById("empName").value,
    job: document.getElementById("empJob").value,
    netSalary: parseFloat(document.getElementById("empNetSalary").value) || 0,
    allowance: parseFloat(document.getElementById("empAllowance").value) || 0,
    deduction: parseFloat(document.getElementById("empDeduction").value) || 0,
    bonus: parseFloat(document.getElementById("empBonus").value) || 0,
    month: document.getElementById("empMonth").value,
    year: parseInt(document.getElementById("empYear").value) || 2026
  };
  
  if (id) {
    const idx = state.employees.findIndex(e => e.id === id);
    state.employees[idx] = newItem;
  } else {
    state.employees.push(newItem);
  }
  
  saveData();
  closeModal("employeeModal");
  renderAll();
}

function deleteEmployee(id) {
  if (confirm("هل أنت متأكد من رغبتك في حذف هذا الموظف وسجل رواتبه؟")) {
    state.employees = state.employees.filter(e => e.id !== id);
    saveData();
    renderAll();
  }
}

// ------------------------------------------
// BUDGET MANAGEMENT
// ------------------------------------------

function openBudgetModal() {
  document.getElementById("inputContractValue").value = state.budgets.contractValue;
  document.getElementById("inputSupplierBudget").value = state.budgets.supplierBudget;
  document.getElementById("inputContractorBudget").value = state.budgets.contractorBudget;
  document.getElementById("inputEmployeeBudget").value = state.budgets.employeeBudget;
  openModal("budgetModal");
}

function saveBudgets(event) {
  event.preventDefault();
  
  state.budgets.contractValue = parseFloat(document.getElementById("inputContractValue").value) || 0;
  state.budgets.supplierBudget = parseFloat(document.getElementById("inputSupplierBudget").value) || 0;
  state.budgets.contractorBudget = parseFloat(document.getElementById("inputContractorBudget").value) || 0;
  state.budgets.employeeBudget = parseFloat(document.getElementById("inputEmployeeBudget").value) || 0;
  
  saveData();
  closeModal("budgetModal");
  renderAll();
}

// ==========================================
// KASHF HESAB (ANALYTICAL ACCOUNT)
// ==========================================

function populateStatementDropdown() {
  const select = document.getElementById("statementSelect");
  const currentValue = select.value;
  
  // Extract unique names
  const supplierNames = [...new Set(state.suppliers.map(s => s.name))];
  const contractorNames = [...new Set(state.contractors.map(c => c.name))];
  
  // Combine unique list
  const allNames = [...new Set([...supplierNames, ...contractorNames])].sort();
  
  select.innerHTML = `<option value="">-- اختر اسماً من القائمة --</option>`;
  allNames.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.innerText = name;
    select.appendChild(opt);
  });
  
  // Restore value if still exists
  if (allNames.includes(currentValue)) {
    select.value = currentValue;
  }
}

function loadStatement() {
  const name = document.getElementById("statementSelect").value;
  const container = document.getElementById("statementResultContainer");
  const placeholder = document.getElementById("statementPlaceholder");
  
  if (!name) {
    container.style.display = "none";
    placeholder.style.display = "block";
    return;
  }
  
  container.style.display = "flex";
  placeholder.style.display = "none";
  
  // Gather records from Suppliers and Contractors
  const supplierRecords = state.suppliers.filter(s => s.name === name);
  const contractorRecords = state.contractors.filter(c => c.name === name);
  
  let type = "مورد";
  let company = "-";
  let totalDebit = 0;
  let totalCredit = 0;
  
  const tbody = document.getElementById("statementTableBody");
  tbody.innerHTML = "";
  
  if (contractorRecords.length > supplierRecords.length) {
    type = "مقاول باطن";
  }
  
  // Add Supplier records
  supplierRecords.forEach(item => {
    company = item.company;
    totalDebit += Number(item.debit);
    totalCredit += Number(item.credit);
    
    let statusClass = "badge-warning";
    if (item.status === "مستلمة") statusClass = "badge-success";
    if (item.status === "مرفوضة") statusClass = "badge-danger";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.code}</td>
      <td>توريد خامات: ${item.item}</td>
      <td><span class="badge ${statusClass}">${item.status}</span></td>
      <td>${formatNumber(item.debit)}</td>
      <td>${formatNumber(item.credit)}</td>
      <td>مايو 2026</td>
    `;
    tbody.appendChild(tr);
  });
  
  // Add Contractor records
  contractorRecords.forEach(item => {
    company = item.company;
    totalDebit += Number(item.debit);
    totalCredit += Number(item.credit);
    
    let statusClass = "badge-warning";
    if (item.status === "مستلم") statusClass = "badge-success";
    if (item.status === "مرفوض") statusClass = "badge-danger";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.code} (مستخلص ${item.invoiceNum})</td>
      <td>أعمال المقاولات: ${item.task}</td>
      <td><span class="badge ${statusClass}">${item.status}</span></td>
      <td>${formatNumber(item.debit)}</td>
      <td>${formatNumber(item.credit)}</td>
      <td>${item.month} ${item.year}</td>
    `;
    tbody.appendChild(tr);
  });
  
  const totalDues = totalDebit + totalCredit;
  
  // Render Meta
  document.getElementById("statementType").innerText = type;
  document.getElementById("statementCompany").innerText = company;
  document.getElementById("statementTotalDebit").innerText = formatCurrency(totalDebit);
  document.getElementById("statementTotalCredit").innerText = formatCurrency(totalCredit);
  document.getElementById("statementTotalDues").innerText = formatCurrency(totalDues);
}

// ==========================================
// IMPORT / EXPORT DATA & RESET
// ==========================================

function exportDataJSON() {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `نسخة_احتياطية_نظام_المقاولات_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      // Validate structure loosely
      if (imported.suppliers && imported.contractors && imported.employees && imported.budgets) {
        state = imported;
        saveData();
        renderAll();
        alert("تم استيراد نسخة البيانات الاحتياطية بنجاح وتحديث النظام!");
      } else {
        alert("فشل الاستيراد: هيكل ملف البيانات غير صحيح.");
      }
    } catch (err) {
      alert("خطأ في قراءة ملف JSON. تأكد من أن الملف سليم.");
    }
  };
  reader.readAsText(file);
}

function resetSystemData() {
  if (confirm("تحذير: هل أنت متأكد من رغبتك في حذف كافة التعديلات والبيانات الحالية وإعادة تعيين النظام بالكامل للمعلومات الافتراضية؟")) {
    useDefaultData();
    renderAll();
    alert("تمت إعادة النظام للحالة الافتراضية بنجاح.");
  }
}

// ==========================================
// EXCEL EXPORT (using SheetJS)
// ==========================================

function exportTableToExcel(tableId, filename) {
  const table = document.getElementById(tableId);
  const clonedTable = table.cloneNode(true);
  
  // Clean Actions column from header
  const headerRow = clonedTable.querySelector('thead tr');
  if (headerRow) {
    headerRow.lastElementChild.remove();
  }
  
  // Clean Actions column from rows
  const bodyRows = clonedTable.querySelectorAll('tbody tr');
  bodyRows.forEach(row => {
    if (row.lastElementChild) {
      row.lastElementChild.remove();
    }
  });

  // Clean Actions column from footer if exists
  const footerRow = clonedTable.querySelector('tfoot tr');
  if (footerRow) {
    footerRow.lastElementChild.remove();
  }

  const wb = XLSX.utils.table_to_book(clonedTable, { sheet: "Sheet1" });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportAllToExcel() {
  const wb = XLSX.utils.book_new();

  function addCleanSheet(tableId, sheetName) {
    const table = document.getElementById(tableId);
    const clonedTable = table.cloneNode(true);
    
    // Clean Actions column from header
    const headerRow = clonedTable.querySelector('thead tr');
    if (headerRow) {
      headerRow.lastElementChild.remove();
    }
    
    // Clean Actions column from rows
    const bodyRows = clonedTable.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
      if (row.lastElementChild) {
        row.lastElementChild.remove();
      }
    });

    // Clean Actions column from footer if exists
    const footerRow = clonedTable.querySelector('tfoot tr');
    if (footerRow) {
      footerRow.lastElementChild.remove();
    }

    const ws = XLSX.utils.table_to_sheet(clonedTable);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  addCleanSheet('supplierTable', 'مصروفات الموردين');
  addCleanSheet('contractorTable', 'مستخلصات المقاولين');
  addCleanSheet('employeeTable', 'رواتب العاملين');

  XLSX.writeFile(wb, 'تقرير_إدارة_المقاولات_الشامل.xlsx');
}

// ==========================================
// CHART.JS INITIALIZATION & UPDATES
// ==========================================

function initCharts() {
  // Get text colors based on current theme
  const isDark = document.body.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "hsl(210, 40%, 95%)" : "hsl(222, 47%, 11%)";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  
  // Destroy old charts to prevent duplicate renders on theme switch
  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();
  
  const ctxBar = document.getElementById("barChart").getContext("2d");
  const ctxPie = document.getElementById("pieChart").getContext("2d");
  
  // Custom font styling
  const fontConfig = {
    family: "Cairo",
    size: 12
  };
  
  // BAR CHART: Budget vs Actual Spent
  barChart = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: ["مصروفات الموردين", "مستخلصات المقاولين", "رواتب العاملين"],
      datasets: [
        {
          label: "الميزانية التقديرية",
          data: [0, 0, 0],
          backgroundColor: "rgba(0, 180, 160, 0.35)",
          borderColor: "hsl(175, 80%, 40%)",
          borderWidth: 1.5,
          borderRadius: 6
        },
        {
          label: "المنصرف الفعلي",
          data: [0, 0, 0],
          backgroundColor: "rgba(37, 99, 235, 0.35)",
          borderColor: "hsl(210, 80%, 45%)",
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: fontConfig
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor, font: fontConfig },
          grid: { display: false }
        },
        y: {
          ticks: { color: textColor, font: fontConfig },
          grid: { color: gridColor }
        }
      }
    }
  });
  
  // PIE CHART: Expense breakdown
  pieChart = new Chart(ctxPie, {
    type: "doughnut",
    data: {
      labels: ["مصروفات الموردين", "مستخلصات المقاولين", "رواتب العاملين"],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: [
          "rgba(0, 180, 160, 0.7)",  // Teal
          "rgba(245, 158, 11, 0.7)",  // Warning orange/yellow
          "rgba(37, 99, 235, 0.7)"   // Blue
        ],
        borderColor: isDark ? "hsl(220, 30%, 12%)" : "white",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textColor,
            font: fontConfig,
            padding: 15
          }
        }
      },
      cutout: "60%"
    }
  });
}

function updateChartsData(budgets, actuals) {
  if (!barChart || !pieChart) return;
  
  // Update Bar Chart
  barChart.data.datasets[0].data = budgets;
  barChart.data.datasets[1].data = actuals;
  barChart.update();
  
  // Update Pie Chart
  pieChart.data.datasets[0].data = actuals;
  pieChart.update();
}

// ==========================================
// HELPERS & MODALS
// ==========================================

function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

function formatCurrency(num) {
  return formatNumber(num) + " ر.س";
}

function formatNumber(num) {
  return Number(num).toLocaleString("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

// Global functions for editing suppliers/contractors/employees
window.editSupplier = openSupplierModal;
window.deleteSupplier = deleteSupplier;
window.editContractor = openContractorModal;
window.deleteContractor = deleteContractor;
window.editEmployee = openEmployeeModal;
window.deleteEmployee = deleteEmployee;
window.openBudgetModal = openBudgetModal;
window.saveBudgets = saveBudgets;
window.saveSupplier = saveSupplier;
window.saveContractor = saveContractor;
window.saveEmployee = saveEmployee;
window.closeModal = closeModal;
window.loadStatement = loadStatement;
window.exportDataJSON = exportDataJSON;
window.importDataJSON = importDataJSON;
window.resetSystemData = resetSystemData;
window.exportTableToExcel = exportTableToExcel;
window.exportAllToExcel = exportAllToExcel;
