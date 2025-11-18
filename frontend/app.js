// Teacher Management System Frontend
// Determine API base: supports both local development and production environments
let API_BASE = (function() {
  try {
    const port = location.port;
    const hostname = location.hostname;
    
    // Production environment: use same origin (deployed together on Render)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api';
    }
    
    // Local development: if running on different port (e.g. Live Server :5500),
    // direct API calls to the backend on port 3000
    if (port && port !== '3000') {
      return `${location.protocol}//${hostname}:3000/api`;
    }
  } catch (e) {
    // fallback to relative path
  }
  return '/api';
})();

// State management
const state = {
  classes: [],
  students: [],
  attendance: [],
  assignments: [],
  grades: [],
  currentClass: null,
  currentAssignment: null
};

// UI helpers: loading and toasts
function showLoading() {
  const el = document.getElementById('global-loader');
  if (el) { el.style.display = 'flex'; el.setAttribute('aria-hidden','false'); }
}

function hideLoading() {
  const el = document.getElementById('global-loader');
  if (el) { el.style.display = 'none'; el.setAttribute('aria-hidden','true'); }
}

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

function showError(message) {
  showToast(message, 'error', 5000);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  initAuth();
  setupEventListeners();
});

// Simple front-end AI prompt handler: updates AI cards with quick mock insights
function handleAIPrompt() {
  const qEl = document.getElementById('ai-prompt');
  if (!qEl) return;
  const q = qEl.value.trim();
  if (!q) { showError('Please enter an AI prompt'); return; }
  showToast('Generating AI insights...', 'info');
  // mock generation - replace contents of ai cards after a short delay
  setTimeout(() => {
    const bodies = document.querySelectorAll('.ai-card .ai-body');
    bodies.forEach((el, idx) => {
      el.textContent = `${['Class summary','At-risk students','Activity suggestions'][idx] || 'Insight'}: ` + q + ' — (AI-generated suggestion)';
    });
    showToast('AI insights ready', 'success');
  }, 900);
}

// Attach AI prompt listeners (safe to call multiple times)
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ai-prompt-btn')?.addEventListener('click', handleAIPrompt);
  document.getElementById('ai-prompt')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAIPrompt(); });
});

function initAuth() {
  const token = localStorage.getItem('tms_token');
  const overlay = document.getElementById('login-overlay');
  if (token) {
    // hide overlay and load app
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('login-active');
    // populate user info from /me
    apiCall('GET', '/me').then(profile => {
      if (profile && profile.name) {
        document.getElementById('user-display').textContent = profile.name;
        document.getElementById('sidebar-username').textContent = profile.name;
        document.getElementById('sidebar-user-role').textContent = profile.school || '';
        // Use first letter of username for avatar
        document.getElementById('sidebar-avatar').textContent = (profile.username || profile.name || 'T').charAt(0).toUpperCase();
      } else {
        document.getElementById('user-display').textContent = 'Signed in';
      }
    }).catch(() => { document.getElementById('user-display').textContent = 'Signed in'; });
    document.getElementById('btn-login').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'inline-block';
    loadDashboard();
  } else {
    if (overlay) overlay.style.display = 'flex';
    // add class to make background blue and hide main UI
    document.body.classList.add('login-active');
  }

  document.getElementById('login-submit')?.addEventListener('click', () => {
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    if (!u || !p) { showError('Enter username and password'); return; }
    apiCall('POST', '/auth/login', { username: u, password: p }).then(res => {
      if (res && res.token) {
          localStorage.setItem('tms_token', res.token);
          if (overlay) overlay.style.display = 'none';
          // remove the login-active state so main UI shows
          document.body.classList.remove('login-active');
          const name = res.teacher.name || res.teacher.username;
          const username = res.teacher.username;
          document.getElementById('user-display').textContent = name;
          document.getElementById('sidebar-username').textContent = name;
          document.getElementById('sidebar-user-role').textContent = res.teacher.school || '';
          // Use first letter of username for avatar
          document.getElementById('sidebar-avatar').textContent = (username || name || 'T').charAt(0).toUpperCase();
          document.getElementById('btn-login').style.display = 'none';
          document.getElementById('btn-logout').style.display = 'inline-block';
          loadDashboard();
        } else {
          showError('Login failed');
        }
    });
  });

  document.getElementById('open-request')?.addEventListener('click', openAccountModalAndHideLogin);
}

// Page Navigation
function setupNavigation() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToPage(item.dataset.page);
    });
  });
}

function navigateToPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  // Show selected page
  const page = document.getElementById(pageName);
  if (page) {
    page.classList.add('active');
    document.getElementById('page-title').textContent = getPageTitle(pageName);
  }
  // Update menu active state
  document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
  const menuItem = document.querySelector(`[data-page="${pageName}"]`);
  if (menuItem) menuItem.classList.add('active');

  // Load page specific data
  loadPageData(pageName);
}

function getPageTitle(page) {
  const titles = {
    dashboard: 'Dashboard',
    classes: 'My Classes',
    students: 'Students',
    attendance: 'Mark Attendance',
    assignments: 'Assignments',
    gradebook: 'Gradebook',
    analytics: 'Analytics',
    'ai-insights': '🤖 AI Student Intelligence',
    resources: 'Learning Resources',
    communications: 'Messages & Announcements',
    meetings: 'Parent-Teacher Meetings',
    'request-account': 'Request Account'
  };
  return titles[page] || 'Dashboard';
}

// API Functions
async function apiCall(method, endpoint, data = null) {
  showLoading();
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);

    // Attach auth token if present
    const token = localStorage.getItem('tms_token');
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_BASE}${endpoint}`;
    let response;
    try {
      response = await fetch(url, options);
    } catch (e) {
      // network-level error (DNS, refused, CORS preflight failed, etc.)
      console.warn('Fetch failed for', url, e && e.message);
      // Do NOT silently fallback to the static server's `/api` (e.g. Live Server at :5500)
      // because that produces confusing 404/405 errors. Instead surface a clear message
      // so the developer/user can start the backend or open the app from the backend origin.
      throw new Error('Network error when contacting backend at ' + url + '. Ensure backend (http://localhost:3000) is running and permits CORS from this origin.');
    }
    if (!response.ok) {
      let errMsg = `HTTP ${response.status}`;
      try {
        const text = await response.text();
        if (text) {
          const json = JSON.parse(text);
          errMsg = json.error || json.message || errMsg;
        } else {
          errMsg = text || errMsg;
        }
      } catch (e) {
        // ignore parse errors
      }
      throw new Error(errMsg);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Show a clearer error to the user
    if (error && error.message && error.message.indexOf('Failed to fetch') !== -1) {
      showError('Network error: Unable to reach backend. Ensure the backend (http://localhost:3000) is running.');
    } else {
      showError(error.message || 'Network error');
    }
    return null;
  } finally {
    hideLoading();
  }
}

// Authentication helpers
function showLoginUI() {
  const name = prompt('Username:');
  const pass = prompt('Password:');
  if (!name || !pass) return;
  apiCall('POST', '/auth/login', { username: name, password: pass }).then(res => {
    if (res && res.token) {
      localStorage.setItem('tms_token', res.token);
      document.getElementById('user-display').textContent = res.teacher.name || res.teacher.username;
      document.getElementById('btn-login').style.display = 'none';
      document.getElementById('btn-logout').style.display = 'inline-block';
        showToast('Logged in successfully', 'success');
      loadDashboard();
    } else {
        showError('Login failed');
    }
  });
}

function logout() {
  localStorage.removeItem('tms_token');
  document.getElementById('user-display').textContent = 'Not signed in';
  document.getElementById('sidebar-username').textContent = 'Not signed in';
  document.getElementById('sidebar-user-role').textContent = 'Guest';
  document.getElementById('sidebar-avatar').textContent = 'T';
  document.getElementById('btn-login').style.display = 'inline-block';
  document.getElementById('btn-logout').style.display = 'none';
  // show login overlay and enforce blue background / hide main UI
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'flex';
  document.body.classList.add('login-active');
}

// Account request modal handlers
function openAccountModal() {
  // Show the request-account page in a modal-like overlay (CSS handles blue background)
  const reqPage = document.getElementById('request-account');
  if (reqPage) {
    reqPage.classList.add('active', 'modal-open');
    reqPage.style.display = 'flex';
    document.body.classList.add('request-modal-active');
  }
}

// When opening the request modal from the login overlay, hide the login overlay
function openAccountModalAndHideLogin() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.classList.remove('login-active');
  openAccountModal();
}

function closeAccountModal() {
  // If user is not authenticated, return to login overlay; otherwise go to dashboard
  const token = localStorage.getItem('tms_token');
  const reqPage = document.getElementById('request-account');
  if (reqPage) {
    reqPage.classList.remove('active', 'modal-open');
    reqPage.style.display = '';
    document.body.classList.remove('request-modal-active');
  }
  
  if (!token) {
    // show login overlay
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.style.display = 'flex';
    document.body.classList.add('login-active');
  } else {
    navigateToPage('dashboard');
  }
}

function submitAccountRequest() {
  const name = document.getElementById('req-name').value.trim();
  const school = document.getElementById('req-school').value.trim();
  const email = document.getElementById('req-email').value.trim();
  const subjects = document.getElementById('req-subjects').value.split(',').map(s => s.trim()).filter(Boolean);
  
  if (!name || !school) { 
    showError('Name and school are required'); 
    return; 
  }
  
  apiCall('POST', '/teacher-requests', { name, school, email, subjects }).then(res => {
    if (res && res.request) {
      showToast('Request submitted successfully! Admin will review and create your account.', 'success');
      // Clear form
      document.getElementById('req-name').value = '';
      document.getElementById('req-school').value = '';
      document.getElementById('req-email').value = '';
      document.getElementById('req-subjects').value = '';
      // Close modal
      closeAccountModal();
    } else {
      showError('Failed to submit request');
    }
  });
}

// Load Dashboard
async function loadDashboard() {
  state.classes = await apiCall('GET', '/classes') || [];
  state.students = await apiCall('GET', '/students') || [];
  state.attendance = await apiCall('GET', '/attendance') || [];
  state.assignments = await apiCall('GET', '/assignments') || [];

  document.getElementById('stat-classes').textContent = state.classes.length;
  document.getElementById('stat-students').textContent = state.students.length;
  document.getElementById('stat-assignments').textContent = state.assignments.length;

  if (state.students.length > 0) {
    const avgAttendance = Math.round((state.attendance.length / Math.max(state.students.length * 30, 1)) * 100);
    document.getElementById('stat-attendance').textContent = avgAttendance + '%';
  }
}

// Load Page Data
async function loadPageData(pageName) {
  try {
    switch(pageName) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'classes':
        await loadClasses();
        break;
      case 'students':
        await loadStudents();
        break;
      case 'attendance':
        await loadAttendancePage();
        break;
      case 'assignments':
        await loadAssignments();
        break;
      case 'gradebook':
        await loadGradebookPage();
        break;
      case 'analytics':
        await loadAnalytics();
        break;
      case 'ai-insights':
        await loadAIInsights();
        break;
      case 'resources':
        await loadResources();
        break;
      case 'communications':
        await loadCommunications();
        break;
      case 'meetings':
        await loadMeetings();
        break;
      case 'phase2-smart-classroom':
        await loadPhase2Page();
        break;
      case 'phase3-security':
        await loadPhase3Page();
        break;
    }
  } catch (error) {
    console.error(`Error loading page ${pageName}:`, error);
  }
}

// Initialize Phase 2 page: populate class selector and load initial dashboard
async function loadPhase2Page() {
  // Ensure students and classes are loaded
  if (!state.students.length) {
    state.students = await apiCall('GET', '/students') || [];
  }
  if (!state.classes.length) {
    state.classes = await apiCall('GET', '/classes') || [];
  }

  // Populate class selector
  const classSelect = document.getElementById('p2-class-select');
  if (classSelect) {
    classSelect.innerHTML = '<option value="">Select a class...</option>' +
      state.classes.map(c => `<option value="${c.id}">${c.name} (${c.subject})</option>`).join('');
    
    // Auto-select first class if available
    if (state.classes.length > 0) {
      classSelect.value = state.classes[0].id;
      loadPhase2Dashboard();
    }
  }
}

// Initialize Phase 3 page: populate class selector and load initial dashboard
async function loadPhase3Page() {
  // Ensure students and classes are loaded
  if (!state.students.length) {
    state.students = await apiCall('GET', '/students') || [];
  }
  if (!state.classes.length) {
    state.classes = await apiCall('GET', '/classes') || [];
  }

  // Populate class selector
  const classSelect = document.getElementById('p3-class-select');
  if (classSelect) {
    classSelect.innerHTML = '<option value="">Select a class...</option>' +
      state.classes.map(c => `<option value="${c.id}">${c.name} (${c.subject})</option>`).join('');
    
    // Auto-select first class if available
    if (state.classes.length > 0) {
      classSelect.value = state.classes[0].id;
      loadPhase3Dashboard();
    }
  }
  
  // Populate student selector for Phase 3 initial class
  const studentSelect = document.getElementById('p3-student-select');
  if (studentSelect && state.classes.length > 0) {
    const classId = state.classes[0].id;
    const students = state.students.filter(s => s.classId === classId);
    studentSelect.innerHTML = '<option value="">Select Student...</option>' +
      students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  }
}

// Classes Management
async function loadClasses() {
  state.classes = await apiCall('GET', '/classes') || [];
  const tbody = document.getElementById('classes-tbody');
  tbody.innerHTML = '';

  state.classes.forEach(cls => {
    const studentCount = state.students.filter(s => s.classId === cls.id).length;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cls.name}</td>
      <td>${cls.section}</td>
      <td>${cls.subject}</td>
      <td>${studentCount}</td>
      <td>
        <button class="btn btn-small" onclick="viewClass('${cls.id}')">View</button>
        <button class="btn btn-small" onclick="openPhase2ForClass('${cls.id}')">Phase 2</button>
        <button class="btn btn-small" onclick="openPhase3ForClass('${cls.id}')">Phase 3</button>
        <button class="btn btn-small" onclick="openConnectModal('${cls.id}')">Connect Student</button>
        <button class="btn btn-small" onclick="deleteClass('${cls.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Modal-based connect student flow
let _connectTargetClassId = null;
let _connectSelectedStudentId = null;

async function openConnectModal(classId) {
  _connectTargetClassId = classId;
  _connectSelectedStudentId = null;
  const modal = document.getElementById('connect-student-modal');
  const listEl = document.getElementById('connect-student-list');
  const classNameEl = document.getElementById('connect-modal-classname');
  classNameEl.textContent = '';
  listEl.innerHTML = '<p class="muted">Loading students...</p>';
  if (modal) modal.style.display = 'flex';

  // load students
  const students = await apiCall('GET', '/students') || [];
  if (!students.length) {
    listEl.innerHTML = '<p>No students available. Create a student first.</p>';
    return;
  }

  classNameEl.textContent = `Class ID: ${classId}`;
  listEl.innerHTML = '';
  students.forEach(s => {
    const row = document.createElement('div');
    row.className = 'student-row';
    row.dataset.studentId = s.id;
    row.innerHTML = `<strong>${s.name}</strong> <div class="muted">roll: ${s.rollNo || '—'} · class: ${s.classId || 'none'}</div>`;
    row.addEventListener('click', () => {
      document.querySelectorAll('#connect-student-list .student-row').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      _connectSelectedStudentId = s.id;
    });
    listEl.appendChild(row);
  });
}

async function closeConnectModal() {
  const modal = document.getElementById('connect-student-modal');
  if (modal) modal.style.display = 'none';
  _connectTargetClassId = null;
  _connectSelectedStudentId = null;
}

async function submitConnect() {
  if (!_connectTargetClassId) return showError('No target class');
  if (!_connectSelectedStudentId) return showError('Select a student first');
  const updated = await apiCall('PUT', `/students/${_connectSelectedStudentId}`, { classId: _connectTargetClassId });
  if (updated) {
    showToast('Student connected to class', 'success');
    closeConnectModal();
    loadClasses();
    loadStudents();
  } else {
    showError('Failed to connect student');
  }
}

// Wire modal buttons (safe guard in case DOM not ready when this script runs)
setTimeout(() => {
  document.getElementById('connect-cancel')?.addEventListener('click', closeConnectModal);
  document.getElementById('connect-submit')?.addEventListener('click', submitConnect);
}, 400);

async function createClass() {
  const name = prompt('Class Name:');
  const section = prompt('Section:');
  const subject = prompt('Subject:');
  
  if (name && section && subject) {
    const newClass = await apiCall('POST', '/classes', {
      name, section, subject, teacher: 'Current Teacher', capacity: 40
    });
    if (newClass) {
      loadClasses();
      showToast('Class created successfully!', 'success');
    }
  }
}

// Open Phase 2 page for a specific class and preselect it
function openPhase2ForClass(classId) {
  navigateToPage('phase2-smart-classroom');
  // ensure class list populated then set value
  setTimeout(() => {
    const sel = document.getElementById('p2-class-select');
    if (sel) {
      sel.value = classId;
      // trigger change handler
      sel.dispatchEvent(new Event('change'));
    }
  }, 200);
}

// Open Phase 3 page for a specific class and preselect it
function openPhase3ForClass(classId) {
  navigateToPage('phase3-security');
  setTimeout(() => {
    const sel = document.getElementById('p3-class-select');
    if (sel) {
      sel.value = classId;
      sel.dispatchEvent(new Event('change'));
    }
  }, 200);
}

async function deleteClass(classId) {
  if (confirm('Delete this class?')) {
    await apiCall('DELETE', `/classes/${classId}`);
    loadClasses();
  }
}

// Students Management
async function loadStudents() {
  state.students = await apiCall('GET', '/students') || [];
  const tbody = document.getElementById('students-tbody');
  tbody.innerHTML = '';

  state.students.forEach(student => {
    const attendance = state.attendance.filter(a => a.studentId === student.id);
    const attendance_rate = attendance.length > 0
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
      : 0;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.rollNo}</td>
      <td>${student.classId}</td>
      <td>${attendance_rate}%</td>
      <td>
        <button class="btn btn-small" onclick="viewStudent('${student.id}')">View</button>
        <button class="btn btn-small" onclick="deleteStudent('${student.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function addStudent() {
  const classId = prompt('Class ID:');
  const name = prompt('Student Name:');
  const rollNo = prompt('Roll No:');
  const email = prompt('Email:');

  if (classId && name && rollNo && email) {
    const newStudent = await apiCall('POST', `/classes/${classId}/students`, {
      name, rollNo, email
    });
    if (newStudent) {
      loadStudents();
      alert('Student added successfully!');
    }
  }
}

async function deleteStudent(studentId) {
  if (confirm('Delete this student?')) {
    await apiCall('DELETE', `/students/${studentId}`);
    loadStudents();
  }
}

async function viewStudent(studentId) {
  const student = await apiCall('GET', `/students/${studentId}`);
  if (student) {
    alert(`
      Name: ${student.name}
      Attendance: ${student.attendance_rate}%
      Average Marks: ${student.avgMarks}
      Total Assignments: ${student.totalAssignments}
    `);
  }
}

// Attendance Management
async function loadAttendancePage() {
  state.classes = await apiCall('GET', '/classes') || [];
  const select = document.getElementById('attendance-class');
  select.innerHTML = '<option value="">Select Class</option>';

  state.classes.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls.id;
    option.textContent = cls.name;
    select.appendChild(option);
  });

  // Use onchange assignment to avoid adding duplicate listeners on repeated calls
  select.onchange = loadAttendanceForm;
}

async function loadAttendanceForm(e) {
  const classId = e.target.value;
  if (!classId) return;
  state.students = await apiCall('GET', `/classes/${classId}/students`) || [];
  const tbody = document.getElementById('attendance-tbody');
  tbody.innerHTML = '';

  // Fetch today's attendance for this class to prefill values
  const today = new Date().toISOString().split('T')[0];
  const existing = await apiCall('GET', `/classes/${classId}/attendance?date=${today}`) || [];

  state.students.forEach(student => {
    const att = existing.find(a => a.studentId === student.id);
    const status = att ? att.status : 'present';
    const reason = att ? att.reason : '';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td>
        <select data-student-id="${student.id}" class="attendance-status">
          <option value="present" ${status==='present'? 'selected':''}>Present</option>
          <option value="absent" ${status==='absent'? 'selected':''}>Absent</option>
          <option value="late" ${status==='late'? 'selected':''}>Late</option>
          <option value="excused" ${status==='excused'? 'selected':''}>Excused</option>
        </select>
      </td>
      <td><input type="text" data-student-id="${student.id}" class="attendance-reason input" placeholder="Reason" value="${reason || ''}"></td>
    `;
    tbody.appendChild(row);
  });
}

async function saveAttendance() {
  const classId = document.getElementById('attendance-class').value;
  if (!classId) {
    alert('Please select a class');
    return;
  }

  const attendanceData = Array.from(document.querySelectorAll('.attendance-status')).map(select => ({
    studentId: select.dataset.studentId,
    status: select.value,
    reason: document.querySelector(`input[data-student-id="${select.dataset.studentId}"]`).value
  }));

  const result = await apiCall('POST', `/classes/${classId}/attendance`, {
    attendanceData,
    date: new Date().toISOString().split('T')[0]
  });

  if (result) {
    alert(`Attendance marked for ${result.marked} students`);
    // refresh dashboard stats and attendance state
    loadDashboard();
  }
}

// Assignments Management
async function loadAssignments() {
  state.assignments = await apiCall('GET', '/assignments') || [];
  // also fetch classes to show names instead of raw ids
  const classes = await apiCall('GET', '/classes') || [];
  const classMap = {};
  classes.forEach(c => classMap[c.id] = c.name || `${c.name} (${c.id})`);

  const tbody = document.getElementById('assignments-tbody');
  tbody.innerHTML = '';

  state.assignments.forEach(assignment => {
    const className = classMap[assignment.classId] || assignment.classId;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${assignment.title}</td>
      <td>${className}</td>
      <td>${assignment.dueDate}</td>
      <td>${assignment.submissions ? assignment.submissions.length : 0}</td>
      <td>
        <button class="btn btn-small" onclick="viewAssignment('${assignment.id}')">View</button>
        <button class="btn btn-small" style="margin-left:8px;" onclick="deleteAssignment('${assignment.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function deleteAssignment(assignmentId) {
  if (!assignmentId) return;
  if (!confirm('Delete this assignment? This will also remove associated grades.')) return;
  const res = await apiCall('DELETE', `/assignments/${assignmentId}`);
  if (res && res.message) {
    await loadAssignments();
    // refresh gradebook/dashboard if open
    if (typeof loadDashboard === 'function') loadDashboard();
    alert('Assignment deleted');
  } else {
    // backend typically returns { message }
    await loadAssignments();
    alert('Assignment deleted');
  }
}

async function createAssignment() {
  // Open modal-based create form
  await openCreateAssignmentModal();
}

// Modal helpers for Create Assignment
async function openCreateAssignmentModal() {
  const modal = document.getElementById('create-assignment-modal');
  const classSelect = document.getElementById('ca-class');
  classSelect.innerHTML = '';

  const classes = await apiCall('GET', '/classes') || [];
  if (!classes.length) return alert('No classes available. Create a class first.');

  classes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.section || ''})`;
    classSelect.appendChild(opt);
  });

  // reset fields
  document.getElementById('ca-title').value = '';
  document.getElementById('ca-desc').value = '';
  document.getElementById('ca-due').value = '';
  document.getElementById('ca-total').value = 100;

  modal.style.display = 'flex';
}

function closeCreateAssignmentModal() {
  const modal = document.getElementById('create-assignment-modal');
  modal.style.display = 'none';
}

async function submitCreateAssignmentModal() {
  const classId = document.getElementById('ca-class').value;
  const title = document.getElementById('ca-title').value.trim();
  const description = document.getElementById('ca-desc').value.trim();
  const dueDate = document.getElementById('ca-due').value.trim();
  const totalMarks = parseInt(document.getElementById('ca-total').value) || 100;

  if (!classId || !title || !dueDate) {
    return alert('Please fill class, title and due date');
  }

  const resp = await apiCall('POST', `/classes/${classId}/assignments`, {
    title, description, dueDate, totalMarks
  });

  if (resp) {
    await loadAssignments();
    closeCreateAssignmentModal();
    alert(`Assignment created and ${resp.createdGrades || 0} grade placeholders initialized.`);
  } else {
    alert('Failed to create assignment');
  }
}

// Gradebook Management
async function loadGradebookPage() {
  state.classes = await apiCall('GET', '/classes') || [];
  const select = document.getElementById('gradebook-class');
  select.innerHTML = '<option value="">Select Class</option>';

  state.classes.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls.id;
    option.textContent = cls.name;
    select.appendChild(option);
  });

  // assign onchange directly to avoid duplicate listeners
  select.onchange = loadGradebookForm;
}

async function loadGradebookForm(e) {
  const classId = e.target.value;
  if (!classId) return;

  state.students = await apiCall('GET', `/classes/${classId}/students`) || [];
  state.assignments = await apiCall('GET', `/classes/${classId}/assignments`) || [];

  const assignmentSelect = document.getElementById('gradebook-assignment');
  assignmentSelect.innerHTML = '<option value="">Select Assignment</option>';
  state.assignments.forEach(a => {
    const option = document.createElement('option');
    option.value = a.id;
    option.textContent = a.title;
    assignmentSelect.appendChild(option);
  });

  // set onchange safely
  assignmentSelect.onchange = async () => {
    const assignmentId = assignmentSelect.value;
    if (assignmentId) await loadGradesList(classId, assignmentId);
  };
}

async function loadGradesList(classId, assignmentId) {
  const tbody = document.getElementById('gradebook-tbody');
  tbody.innerHTML = '';

  // load existing grades for this class
  const grades = await apiCall('GET', `/classes/${classId}/grades`) || [];
  // build a lookup for existing grade by student for this assignment
  const existingMap = {};
  grades.forEach(g => {
    if (g.assignmentId === assignmentId) existingMap[g.studentId] = g;
  });

  state.currentGrades = existingMap;

  state.students.forEach(student => {
    const existing = existingMap[student.id];
    const marksVal = existing ? existing.marksObtained : '';
    const feedbackVal = existing ? existing.feedback : '';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td><input type="number" min="0" max="100" class="marks-input input" data-student-id="${student.id}" placeholder="Marks" value="${marksVal}"></td>
      <td><input type="text" class="feedback-input input" data-student-id="${student.id}" placeholder="Feedback" value="${feedbackVal}"></td>
    `;
    tbody.appendChild(row);
  });
}

async function saveGrades() {
  const classId = document.getElementById('gradebook-class').value;
  const assignmentId = document.getElementById('gradebook-assignment').value;

  if (!classId || !assignmentId) {
    showError('Please select class and assignment');
    return;
  }

  const saves = [];
  for (const input of document.querySelectorAll('.marks-input')) {
    const studentId = input.dataset.studentId;
    const marks = parseInt(input.value);
    const feedbackEl = document.querySelector(`.feedback-input[data-student-id="${studentId}"]`);
    const feedback = feedbackEl ? feedbackEl.value : '';

    // only save when a numeric mark is provided
    if (!Number.isNaN(marks) && marks >= 0) {
      const existing = state.currentGrades && state.currentGrades[studentId];
      if (existing && existing.id) {
        // update existing grade
        const p = apiCall('PUT', `/grades/${existing.id}`, {
          classId, studentId, assignmentId, marksObtained: marks, feedback
        });
        saves.push(p);
      } else {
        // create new grade
        const p = apiCall('POST', '/grades', {
          classId, studentId, assignmentId, marksObtained: marks, feedback
        });
        saves.push(p);
      }
    }
  }

  // wait for all save requests
  await Promise.all(saves);

  // refresh the list and dashboard
  await loadGradesList(classId, assignmentId);
  if (typeof loadDashboard === 'function') await loadDashboard();

  showToast('Grades saved successfully!', 'success');
}

// Analytics
async function loadAnalytics() {
  // ensure we have classes loaded
  if (!state.classes.length) await loadDashboard();

  const classSelect = document.getElementById('analytics-class-select');
  // populate select
  if (classSelect) {
    classSelect.innerHTML = '';
    state.classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} ${c.section ? '('+c.section+')' : ''}`;
      classSelect.appendChild(opt);
    });
  }

  const chosenClassId = classSelect ? classSelect.value || state.classes[0]?.id : state.classes[0]?.id;
  if (!chosenClassId) return;

  const analytics = await apiCall('GET', `/classes/${chosenClassId}/analytics`);
  if (analytics) {
    // Top performers
    const topPerformersDiv = document.getElementById('top-performers');
    topPerformersDiv.innerHTML = analytics.topPerformers
      .map(p => `<div class="card"><strong>${p.name}</strong><br/>Avg: ${p.average}%</div>`)
      .join('');

    // Weak topics
    const weakTopicsDiv = document.getElementById('weak-topics');
    weakTopicsDiv.innerHTML = analytics.weakestTopics
      .map(t => `<div class="card"><strong>${t.topic}</strong><br/>Avg: ${t.average}%</div>`)
      .join('');

  // display overall average
  const overallEl = document.getElementById('analytics-overall');
  if (overallEl) overallEl.textContent = `Avg: ${analytics.overallAverage || 0}%`;

  // Overall class average - draw chart
  const perfCanvas = document.getElementById('performance-chart');
    if (perfCanvas && perfCanvas.getContext) {
      // draw simple bar chart for student averages
      const ctx = perfCanvas.getContext('2d');
      const students = analytics.studentAverages || [];
      const labels = students.map(s => s.name);
      const values = students.map(s => s.average);

      // responsive canvas size
      const width = Math.min(900, Math.max(600, labels.length * 50));
      const height = 300;
      perfCanvas.width = width;
      perfCanvas.height = height;

      // clear
      ctx.clearRect(0, 0, width, height);
      // background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);

      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      const maxVal = 100; // percent scale
      const barWidth = Math.max(12, chartWidth / Math.max(1, labels.length) - 8);

      // draw y axis lines
      ctx.strokeStyle = '#eee';
      ctx.fillStyle = '#666';
      ctx.font = '12px sans-serif';
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight * i) / 5;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
        const label = Math.round((1 - i / 5) * maxVal);
        ctx.fillText(label + '%', 6, y + 4);
      }

      // draw bars
      students.forEach((s, idx) => {
        const val = values[idx] || 0;
        const x = padding + idx * (barWidth + 8) + 8;
        const h = (val / maxVal) * chartHeight;
        const y = padding + chartHeight - h;

        // bar
        ctx.fillStyle = 'rgba(102,126,234,0.9)';
        ctx.fillRect(x, y, barWidth, h);

        // value label
        ctx.fillStyle = '#333';
        ctx.font = '11px sans-serif';
        ctx.fillText(val + '%', x, y - 6);

        // x label (rotate if necessary)
        ctx.save();
        ctx.translate(x + barWidth / 2, padding + chartHeight + 14);
        ctx.rotate(-Math.PI / 6);
        ctx.textAlign = 'right';
        ctx.fillText(labels[idx], 0, 0);
        ctx.restore();
      });
    }
  }

  // wire change handler for class selection
  const classSelectEl = document.getElementById('analytics-class-select');
  if (classSelectEl) {
    classSelectEl.onchange = async () => {
      // update state and reload
      await loadAnalytics();
    };
  }
}

// Resources Management
async function loadResources() {
  const resources = await apiCall('GET', '/resources') || [];
  const container = document.getElementById('resources-list');

  if (container) {
    container.innerHTML = '';
    resources.forEach(resource => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '12px';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div>
            <strong>${resource.title}</strong><div class="muted">${resource.category || ''} · ${resource.type}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <a class="btn" href="${resource.url}" target="_blank">Download</a>
            <button class="btn" onclick="deleteResource('${resource.id}')">Delete</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }
}

async function deleteResource(resourceId) {
  if (confirm('Delete this resource?')) {
    await apiCall('DELETE', `/resources/${resourceId}`);
    loadResources();
  }
}

// Communications Management
async function loadCommunications() {
  const messages = await apiCall('GET', '/communications') || [];
  const container = document.getElementById('messages-list');

  if (container) {
    container.innerHTML = '';
    messages.forEach(msg => {
      const el = document.createElement('div');
      el.className = 'card';
      el.style.marginBottom = '8px';
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:start;gap:12px;">
          <div>
            <strong>${msg.senderId || 'Teacher'}</strong>
            <div class="muted">${new Date(msg.sentAt || msg.sentAt).toLocaleString ? new Date(msg.sentAt || Date.now()).toLocaleString() : ''}</div>
            <p style="margin-top:8px;">${msg.message}</p>
          </div>
          <div>
            <button class="btn" onclick="deleteMessage('${msg.id}')">Delete</button>
          </div>
        </div>
      `;
      container.appendChild(el);
    });
  }
}

// send-message handler
async function sendMessage() {
  const text = document.getElementById('message-input')?.value;
  if (!text || !text.trim()) { showError('Enter a message'); return; }
  // For now send as anonymous teacher (frontend will not attach senderId). Backend will store message.
  const res = await apiCall('POST', '/messages', { senderId: 'teacher', receiverId: 'class', message: text, type: 'message' });
  if (res) {
    document.getElementById('message-input').value = '';
    loadCommunications();
  } else {
    showError('Failed to send message');
  }
}

// upload resource handler (simple prompt)
async function uploadResource() {
  const title = prompt('Resource title:');
  if (!title) return;
  const url = prompt('Resource URL:');
  if (!url) return;
  const category = prompt('Category (optional):');
  const type = prompt('Type (pdf,video,link):','pdf');
  const res = await apiCall('POST', '/resources', { title, url, category, type });
  if (res) {
    showToast('Resource uploaded', 'success');
    loadResources();
  } else showError('Failed to upload');
}

async function deleteMessage(messageId) {
  if (confirm('Delete this message?')) {
    const res = await apiCall('DELETE', `/communications/${messageId}`);
    if (res !== null) {
      showToast('Message deleted', 'success');
      loadCommunications();
    } else {
      showError('Failed to delete message');
    }
  }
}

// Meetings Management
async function loadMeetings() {
  const meetings = await apiCall('GET', '/meetings') || [];
  const tbody = document.getElementById('meetings-tbody');
  
  if (tbody) {
    tbody.innerHTML = '';
    if (!meetings || !meetings.length) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="5" class="muted">No meetings scheduled.</td>`;
      tbody.appendChild(row);
      return;
    }
    meetings.forEach(meeting => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${meeting.parentName}</td>
        <td>${meeting.studentName}</td>
        <td>${meeting.date}</td>
        <td>${meeting.status}</td>
        <td><button class="btn-delete" onclick="deleteMeeting('${meeting.id}')">Delete</button></td>
      `;
      tbody.appendChild(row);
    });
  }
}

async function deleteMeeting(meetingId) {
  if (confirm('Delete this meeting?')) {
    await apiCall('DELETE', `/meetings/${meetingId}`);
    loadMeetings();
  }
}

// Schedule Meeting modal helpers
async function openScheduleMeetingModal() {
  const modal = document.getElementById('schedule-meeting-modal');
  const classSelect = document.getElementById('sm-class');
  const studentSelect = document.getElementById('sm-student');
  classSelect.innerHTML = '';
  studentSelect.innerHTML = '';

  const classes = await apiCall('GET', '/classes') || [];
  if (!classes.length) return alert('No classes available. Create a class first.');
  classes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.section || ''})`;
    classSelect.appendChild(opt);
  });

  // when class changes, load students
  classSelect.onchange = async () => {
    const cid = classSelect.value;
    const students = await apiCall('GET', `/classes/${cid}/students`) || [];
    studentSelect.innerHTML = '';
    students.forEach(s => {
      const so = document.createElement('option');
      so.value = s.id;
      so.textContent = s.name;
      studentSelect.appendChild(so);
    });
  };

  // trigger initial population
  if (classSelect.options.length) {
    classSelect.dispatchEvent(new Event('change'));
  }

  document.getElementById('sm-parent').value = '';
  document.getElementById('sm-date').value = '';
  modal.style.display = 'flex';
}

function closeScheduleMeetingModal() {
  const modal = document.getElementById('schedule-meeting-modal');
  modal.style.display = 'none';
}

async function submitScheduleMeetingModal() {
  const classId = document.getElementById('sm-class').value;
  const studentId = document.getElementById('sm-student').value;
  const parentName = document.getElementById('sm-parent').value.trim();
  const scheduledDate = document.getElementById('sm-date').value.trim();

  if (!classId || !studentId || !parentName || !scheduledDate) {
    return showError('Please fill all fields');
  }

  const resp = await apiCall('POST', `/classes/${classId}/meetings`, { studentId, parentName, scheduledDate });
  if (resp) {
    closeScheduleMeetingModal();
    await loadMeetings();
    showToast('Meeting scheduled', 'success');
  } else {
    showError('Failed to schedule meeting');
  }
}

// ==================== AI INSIGHTS & ANALYTICS ====================

async function loadAIInsights() {
  // Load classes for selection
  state.classes = await apiCall('GET', '/classes') || [];
  const classSelect = document.getElementById('ai-class-select');
  classSelect.innerHTML = '<option value="">Select Class</option>';
  
  state.classes.forEach(cls => {
    const opt = document.createElement('option');
    opt.value = cls.id;
    opt.textContent = `${cls.name} (${cls.section || ''})`;
    classSelect.appendChild(opt);
  });

  // Load AI dashboard if class selected
  classSelect.onchange = async () => {
    const classId = classSelect.value;
    if (!classId) return;
    await loadAIDashboard(classId);
  };

  // Load first class by default if available
  if (state.classes.length > 0) {
    classSelect.value = state.classes[0].id;
    await loadAIDashboard(state.classes[0].id);
  }
}

async function loadAIDashboard(classId) {
  const dashboard = await apiCall('GET', `/ai/dashboard/${classId}`);
  if (!dashboard) return showError('Failed to load AI dashboard');

  // Display at-risk students
  const atRiskDiv = document.getElementById('ai-at-risk-students');
  atRiskDiv.innerHTML = dashboard.atRiskStudents.length === 0
    ? '<p class="muted">No students at risk</p>'
    : dashboard.atRiskStudents.map(s => `
      <div style="padding: 12px; background: #fff; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid #ff6b6b;">
        <strong>${s.studentName}</strong><br/>
        <span class="muted">Risk Score: ${s.riskScore} | Confidence: ${s.confidence}%</span><br/>
        <span class="muted">Avg: ${s.avgPercentage}% | Recommendation: ${s.recommendation}</span>
      </div>
    `).join('');

  // Display top performers
  const topDiv = document.getElementById('ai-top-students');
  topDiv.innerHTML = dashboard.topStudents.length === 0
    ? '<p class="muted">No top performers yet</p>'
    : dashboard.topStudents.map(s => `
      <div style="padding: 12px; background: #fff; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid #51cf66;">
        <strong>${s.studentName}</strong><br/>
        <span class="muted">Performance: ${s.avgPercentage}% | Confidence: ${s.confidence}%</span><br/>
        <span class="muted">Recommendation: ${s.recommendation}</span>
      </div>
    `).join('');

  // Display performance heatmap
  const heatmapDiv = document.getElementById('ai-heatmap');
  heatmapDiv.innerHTML = '<table style="width: 100%; border-collapse: collapse;">'
    + '<thead><tr><th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Topic</th>'
    + '<th style="padding: 8px; border: 1px solid #ddd;">Class Avg</th>'
    + '<th style="padding: 8px; border: 1px solid #ddd;">Difficulty</th></tr></thead><tbody>'
    + dashboard.performanceHeatmap.map(t => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${t.topic}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; background: ${t.classAverage >= 75 ? '#d4edda' : t.classAverage >= 50 ? '#fff3cd' : '#f8d7da'};">
          ${t.classAverage}%
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${t.difficulty}</td>
      </tr>
    `).join('')
    + '</tbody></table>';

  // Display grading insights
  const insightsDiv = document.getElementById('ai-grading-insights');
  insightsDiv.innerHTML = `
    <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
      <p><strong>Class Average:</strong> ${dashboard.gradingInsights.classAverage}%</p>
      <p><strong>Total Students:</strong> ${dashboard.gradingInsights.totalStudents}</p>
    </div>
    <div>
      <h5 style="margin-top: 0;">Action Items:</h5>
      <ul style="margin: 8px 0; padding-left: 20px;">
        ${dashboard.gradingInsights.actionItems.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `;
}

// Generate AI Quiz Modal
async function openGenerateQuizModal() {
  const modal = document.getElementById('generate-quiz-modal');
  const classSelect = document.getElementById('gq-class');
  classSelect.innerHTML = '';

  if (!state.classes || state.classes.length === 0) {
    state.classes = await apiCall('GET', '/classes') || [];
  }

  state.classes.forEach(cls => {
    const opt = document.createElement('option');
    opt.value = cls.id;
    opt.textContent = `${cls.name} (${cls.section || ''})`;
    classSelect.appendChild(opt);
  });

  document.getElementById('gq-topics').value = '';
  document.getElementById('gq-difficulty').value = 'medium';
  document.getElementById('gq-questions').value = 10;

  if (modal) modal.style.display = 'flex';
}

function closeGenerateQuizModal() {
  const modal = document.getElementById('generate-quiz-modal');
  if (modal) modal.style.display = 'none';
}

async function submitGenerateQuiz() {
  const classId = document.getElementById('gq-class').value;
  const topicsStr = document.getElementById('gq-topics').value;
  const difficulty = document.getElementById('gq-difficulty').value;
  const numQuestions = parseInt(document.getElementById('gq-questions').value);

  if (!classId || !topicsStr) {
    return showError('Please select class and enter topics');
  }

  const topics = topicsStr.split(',').map(t => t.trim()).filter(Boolean);

  const quiz = await apiCall('POST', '/ai/generate/quiz', {
    classId, topics, difficulty, numQuestions
  });

  if (quiz) {
    showToast(`Quiz generated with ${quiz.totalQuestions} questions!`, 'success');
    closeGenerateQuizModal();
    // Show quiz details in alert
    alert(`📝 Quiz Generated!\n\nQuestions: ${quiz.totalQuestions}\nTotal Marks: ${quiz.totalMarks}\nEstimated Time: ${quiz.estimatedTime} minutes\n\nQuiz ID: ${quiz.quizId}`);
  } else {
    showError('Failed to generate quiz');
  }
}

// Generate Worksheet Modal
async function openGenerateWorksheetModal() {
  const modal = document.getElementById('generate-worksheet-modal');
  const studentSelect = document.getElementById('gw-student');
  studentSelect.innerHTML = '';

  if (!state.students || state.students.length === 0) {
    state.students = await apiCall('GET', '/students') || [];
  }

  state.students.forEach(student => {
    const opt = document.createElement('option');
    opt.value = student.id;
    opt.textContent = student.name;
    studentSelect.appendChild(opt);
  });

  document.getElementById('gw-topic').value = '';
  document.getElementById('gw-difficulty').value = 'beginner';

  if (modal) modal.style.display = 'flex';
}

function closeGenerateWorksheetModal() {
  const modal = document.getElementById('generate-worksheet-modal');
  if (modal) modal.style.display = 'none';
}

async function submitGenerateWorksheet() {
  const studentId = document.getElementById('gw-student').value;
  const topicId = document.getElementById('gw-topic').value;
  const difficulty = document.getElementById('gw-difficulty').value;

  if (!studentId || !topicId) {
    return showError('Please select student and enter topic');
  }

  const worksheet = await apiCall('POST', '/ai/generate/worksheet', {
    studentId, topicId, difficulty
  });

  if (worksheet) {
    showToast(`Worksheet generated for ${worksheet.studentName}!`, 'success');
    closeGenerateWorksheetModal();
    alert(`📋 Remedial Worksheet Generated!\n\nStudent: ${worksheet.studentName}\nTopic: ${worksheet.topic}\nProblems: ${worksheet.totalProblems}\nEstimated Time: ${worksheet.estimatedTime}\n\nWorksheet ID: ${worksheet.worksheetId}`);
  } else {
    showError('Failed to generate worksheet');
  }
}

// ==================== END AI INSIGHTS ====================


async function openBulkImportModal() {
  const classId = state.currentClass;
  if (!classId) {
    // if no class selected, let user select one
    state.classes = await apiCall('GET', '/classes') || [];
    if (!state.classes.length) {
      return showError('No classes available. Create a class first.');
    }
    // for now, use first class
    state.currentClass = state.classes[0].id;
  }
  const modal = document.getElementById('bulk-import-modal');
  document.getElementById('bulk-import-csv').value = '';
  if (modal) modal.style.display = 'flex';
}

function closeBulkImportModal() {
  const modal = document.getElementById('bulk-import-modal');
  if (modal) modal.style.display = 'none';
}

async function submitBulkImport() {
  const csvText = document.getElementById('bulk-import-csv')?.value;
  if (!csvText || !csvText.trim()) {
    return showError('Please enter CSV data');
  }

  // Parse CSV: each line is "name,rollNo,email,phone"
  const lines = csvText.trim().split('\n').filter(l => l.trim());
  const students = lines.map(line => {
    const parts = line.split(',').map(p => p.trim());
    return {
      name: parts[0] || '',
      rollNo: parts[1] || '',
      email: parts[2] || '',
      phone: parts[3] || ''
    };
  });

  if (!students.length) {
    return showError('No valid student records found');
  }

  // Get class selection - show quick dialog if not set
  let classId = state.currentClass;
  if (!classId) {
    state.classes = await apiCall('GET', '/classes') || [];
    if (!state.classes.length) {
      return showError('No classes available');
    }
    classId = state.classes[0].id;
  }

  // Call bulk import endpoint
  const result = await apiCall('POST', `/classes/${classId}/students/import`, { students });
  if (result) {
    showToast(`Imported ${result.imported} students successfully!`, 'success');
    closeBulkImportModal();
    loadStudents();
  } else {
    showError('Failed to import students');
  }
}

// ==================== PHASE 2: SMART CLASSROOM & LESSON PLANNING ====================

function loadPhase2Dashboard() {
  const classId = document.getElementById('p2-class-select')?.value;
  if (!classId) return;

  // Load classroom dashboard
  apiCall(`/api/phase2/classroom/dashboard/${classId}`)
    .then(res => displayClassroomDashboard(res.data))
    .catch(err => showToast('Error loading classroom dashboard: ' + err.message, 'error'));

  // Load engagement heatmap
  apiCall(`/api/phase2/classroom/engagement/${classId}`)
    .then(res => displayEngagementHeatmap(res.data))
    .catch(err => showToast('Error loading engagement data: ' + err.message, 'error'));

  // Populate student selects
  const students = state.students.filter(s => s.classId === classId);
  document.getElementById('p2-student-select').innerHTML = '<option value="">Select Student...</option>' +
    students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  document.getElementById('p2-content-student').innerHTML = document.getElementById('p2-student-select').innerHTML;
}

function displayClassroomDashboard(data) {
  const html = `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px;">
      <div class="stat-card" style="background: #e3f2fd; border-left: 4px solid #2196f3;">
        <div style="font-size: 12px; color: #666;">Unresolved Doubts</div>
        <div style="font-size: 24px; font-weight: bold; color: #2196f3;">${data.totalUnresolvedDoubts}</div>
      </div>
      <div class="stat-card" style="background: #fff3e0; border-left: 4px solid #ff9800;">
        <div style="font-size: 12px; color: #666;">Students with Doubts</div>
        <div style="font-size: 24px; font-weight: bold; color: #ff9800;">${data.totalDoubtStudents}</div>
      </div>
    </div>
    <div style="margin-top: 16px;">
      <h5>📍 Concept Hotspots (Top 5):</h5>
      ${data.conceptHotspots.length > 0 ? `
        <table style="width: 100%; margin-top: 8px;">
          <tr style="background: #f5f5f5;">
            <th style="text-align: left; padding: 8px;">Concept</th>
            <th style="text-align: center; padding: 8px;">Doubts</th>
          </tr>
          ${data.conceptHotspots.map(c => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.concept}</td>
              <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;"><strong>${c.count}</strong></td>
            </tr>
          `).join('')}
        </table>
      ` : '<p class="muted">No doubts recorded yet.</p>'}
    </div>
  `;
  document.getElementById('p2-classroom-dashboard').innerHTML = html;
}

function displayEngagementHeatmap(data) {
  const html = `
    <div style="margin-top: 12px;">
      <div class="stat-card" style="background: #e8f5e9; border-left: 4px solid #4caf50; margin-bottom: 12px;">
        <div style="font-size: 12px; color: #666;">Average Class Engagement</div>
        <div style="font-size: 28px; font-weight: bold; color: #4caf50;">${data.avgEngagement}%</div>
      </div>
      <table style="width: 100%;">
        <tr style="background: #f5f5f5;">
          <th style="text-align: left; padding: 8px;">Student</th>
          <th style="text-align: center; padding: 8px;">Engagement</th>
          <th style="text-align: center; padding: 8px;">Status</th>
        </tr>
        ${data.engagement.slice(0, 10).map(e => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${e.studentName}</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">
              <div style="background: #f0f0f0; border-radius: 4px; height: 8px; width: 100%; margin: 4px 0;">
                <div style="background: ${e.engagementScore >= 75 ? '#4caf50' : e.engagementScore >= 50 ? '#ff9800' : '#f44336'}; 
                           height: 100%; width: ${e.engagementScore}%; border-radius: 4px;"></div>
              </div>
              ${e.engagementScore}%
            </td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; 
                           background: ${e.status === 'HIGH' ? '#c8e6c9' : e.status === 'MEDIUM' ? '#ffe0b2' : '#ffcccc'};
                           color: ${e.status === 'HIGH' ? '#2e7d32' : e.status === 'MEDIUM' ? '#e65100' : '#c62828'};">
                ${e.status}
              </span>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;
  document.getElementById('p2-engagement-heatmap').innerHTML = html;
}

function openGenerateLessonModal() {
  const classId = document.getElementById('p2-class-select')?.value;
  if (!classId) {
    showToast('Please select a class first', 'warning');
    return;
  }

  const topicId = prompt('Enter topic name (e.g., "Quadratic Equations"):');
  if (!topicId) return;

  const duration = prompt('Enter lesson duration in minutes (default: 60):', '60');
  if (!duration) return;

  apiCall('/api/phase2/lesson/generate', 'POST', {
    classId,
    topicId,
    duration: parseInt(duration)
  })
    .then(res => {
      const plan = res.data;
      let html = `
        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; border-radius: 4px; margin-top: 12px;">
          <h5>📖 Lesson Plan: ${plan.topicId}</h5>
          <p><strong>Total Duration:</strong> ${plan.totalDuration} minutes</p>
          
          <h5 style="margin-top: 12px;">Learning Objectives:</h5>
          <ul style="margin: 8px 0; padding-left: 20px;">
            ${plan.learningObjectives.map(obj => `<li>${obj}</li>`).join('')}
          </ul>

          <h5 style="margin-top: 12px;">Lesson Sections:</h5>
          ${plan.sections.map(s => `
            <div style="background: white; padding: 8px; margin: 8px 0; border-radius: 4px; border-left: 3px solid #2196f3;">
              <strong>${s.name}</strong> (${s.duration} min)
              <ul style="margin: 4px 0; padding-left: 20px; font-size: 12px;">
                ${s.activities.map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
          `).join('')}

          <h5 style="margin-top: 12px;">Resources:</h5>
          <ul style="margin: 8px 0; padding-left: 20px; font-size: 12px;">
            ${plan.resources.map(r => `<li>${r}</li>`).join('')}
          </ul>

          <h5 style="margin-top: 12px;">Assessment Methods:</h5>
          <p style="font-size: 12px;">${plan.assessmentMethods.join(', ')}</p>

          <h5 style="margin-top: 12px;">Differentiation:</h5>
          <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 12px;">
            <strong>For Advanced:</strong> ${plan.differentiation.forAdvanced.join(', ')}<br>
            <strong>For Struggling:</strong> ${plan.differentiation.forStruggling.join(', ')}
          </div>
        </div>
      `;
      document.getElementById('p2-feedback-result').innerHTML = html;
      showToast('Lesson plan generated successfully!', 'success');
    })
    .catch(err => showToast('Error generating lesson plan: ' + err.message, 'error'));
}

function suggestLessonTime() {
  const classId = document.getElementById('p2-class-select')?.value;
  if (!classId) {
    showToast('Please select a class first', 'warning');
    return;
  }

  apiCall(`/api/phase2/lesson/suggest-time/${classId}`)
    .then(res => {
      const suggestion = res.data;
      const html = `
        <div style="background: #f3e5f5; border-left: 4px solid #9c27b0; padding: 12px; border-radius: 4px; margin-top: 12px;">
          <h5>⏰ Suggested Lesson Time</h5>
          <p><strong>Best Days:</strong> ${suggestion.data.days.join(', ')}</p>
          <p><strong>Best Time Slots:</strong> ${suggestion.data.timeSlots.join(', ')}</p>
          <p style="margin-top: 8px; font-size: 12px; color: #666;"><strong>Reason:</strong> ${suggestion.data.reason}</p>
        </div>
      `;
      document.getElementById('p2-feedback-result').innerHTML = html;
    })
    .catch(err => showToast('Error getting suggestion: ' + err.message, 'error'));
}

function generateStudentFeedback() {
  const studentId = document.getElementById('p2-student-select')?.value;
  if (!studentId) {
    showToast('Please select a student', 'warning');
    return;
  }

  apiCall(`/api/phase2/feedback/student/${studentId}`)
    .then(res => {
      const fb = res.data;
      let html = `
        <div style="background: #f1f8e9; border-left: 4px solid #689f38; padding: 12px; border-radius: 4px; margin-top: 12px;">
          <h5>💬 Personalized Feedback for ${fb.studentName}</h5>
          <p><strong>Overall Grade:</strong> ${fb.overallGrade}% | <strong>Attendance:</strong> ${fb.attendanceRate}%</p>
          
          <div style="background: #dcedc8; padding: 8px; border-radius: 4px; margin-top: 8px;">
            <p>${fb.overallComment}</p>
          </div>

          ${fb.strengths.length > 0 ? `
            <div style="margin-top: 12px;">
              <h5 style="color: #2e7d32;">✅ Strengths:</h5>
              <ul style="padding-left: 20px;">
                ${fb.strengths.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${fb.areasForImprovement.length > 0 ? `
            <div style="margin-top: 12px;">
              <h5 style="color: #c62828;">📈 Areas for Improvement:</h5>
              <ul style="padding-left: 20px;">
                ${fb.areasForImprovement.map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="margin-top: 12px; background: #fff9c4; padding: 8px; border-radius: 4px;">
            <h5>💡 Study Tips:</h5>
            <ul style="padding-left: 20px; font-size: 12px;">
              ${fb.studyTips.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-top: 12px; background: #e1f5fe; padding: 8px; border-radius: 4px;">
            <h5>📋 Recommended Actions:</h5>
            <ul style="padding-left: 20px; font-size: 12px;">
              ${fb.recommendedActions.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
      document.getElementById('p2-feedback-result').innerHTML = html;
      showToast('Feedback generated successfully!', 'success');
    })
    .catch(err => showToast('Error generating feedback: ' + err.message, 'error'));
}

function getContentRecommendations() {
  const classId = document.getElementById('p2-class-select')?.value;
  const studentId = document.getElementById('p2-content-student')?.value;
  
  if (!classId || !studentId) {
    showToast('Please select class and student', 'warning');
    return;
  }

  apiCall(`/api/phase2/content/recommend/${studentId}/${classId}`)
    .then(res => {
      const recs = res.data;
      let html = `
        <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 12px; border-radius: 4px; margin-top: 12px;">
          <h5>📚 Content Recommendations for ${recs.studentName}</h5>
          <p class="muted">Total resources recommended: ${recs.totalResources}</p>
          
          ${recs.recommendations.map((rec, idx) => `
            <div style="background: white; padding: 8px; margin: 8px 0; border-radius: 4px; border-left: 3px solid #ff9800;">
              <strong>${rec.topic}</strong> 
              <span style="background: ${rec.severity === 'high' ? '#ffcdd2' : rec.severity === 'medium' ? '#ffe0b2' : '#e0f2f1'}; 
                           padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                ${rec.severity.toUpperCase()}
              </span>
              <div style="margin-top: 6px; font-size: 12px;">
                <strong>Videos:</strong> ${rec.suggestedContent.videos.length} | 
                <strong>MCQs:</strong> ${rec.suggestedContent.mcqs.length} | 
                <strong>PYQs:</strong> ${rec.suggestedContent.pyqs.length} | 
                <strong>Notes:</strong> ${rec.suggestedContent.notes.length}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      document.getElementById('p2-recommendations-result').innerHTML = html;
      showToast('Recommendations loaded!', 'success');
    })
    .catch(err => showToast('Error loading recommendations: ' + err.message, 'error'));
}

// ==================== PHASE 3: SECURITY & OPTIMIZATION ====================

function loadPhase3Dashboard() {
  const classId = document.getElementById('p3-class-select')?.value;
  if (!classId) return;

  // Populate student selects
  const students = state.students.filter(s => s.classId === classId);
  document.getElementById('p3-student-select').innerHTML = '<option value="">Select Student...</option>' +
    students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  document.getElementById('p3-parent-student').innerHTML = document.getElementById('p3-student-select').innerHTML;
  document.getElementById('p3-compare-student').innerHTML = document.getElementById('p3-student-select').innerHTML;
}

function optimizeClassSchedule() {
  const classId = document.getElementById('p3-class-select')?.value;
  if (!classId) {
    showToast('Please select a class', 'warning');
    return;
  }

  apiCall(`/api/phase3/schedule/optimize/${classId}`)
    .then(res => {
      const opt = res.data;
      const html = `
        <div style="background: #e0f2f1; border-left: 4px solid #009688; padding: 12px; border-radius: 4px; margin-top: 12px;">
          <h5>⏱️ Schedule Optimization Result</h5>
          <p><strong>Recommended Days:</strong> ${opt.recommendedSchedule.days.join(', ')}</p>
          <p><strong>Recommended Time Slots:</strong> ${opt.recommendedSchedule.timeSlots.join(', ')}</p>
          <p style="margin-top: 8px; background: #b2dfdb; padding: 8px; border-radius: 4px;">
            <strong>Expected Attendance Improvement:</strong> ${opt.expectedAttendanceImprovement}
          </p>
          <h5 style="margin-top: 12px;">Implementation Notes:</h5>
          <ul style="padding-left: 20px; font-size: 12px;">
            ${opt.implementationNotes.map(n => `<li>${n}</li>`).join('')}
          </ul>
        </div>
      `;
      document.getElementById('p3-schedule-result').innerHTML = html;
      showToast('Schedule optimization complete!', 'success');
    })
    .catch(err => showToast('Error optimizing schedule: ' + err.message, 'error'));
}

function analyzeStudentPattern() {
  const studentId = document.getElementById('p3-student-select')?.value;
  if (!studentId) {
    showToast('Please select a student', 'warning');
    return;
  }

  apiCall(`/api/phase3/schedule/analyze/${studentId}`)
    .then(res => {
      const pattern = res.data;
      const html = `
        <div style="background: #fce4ec; border-left: 4px solid #e91e63; padding: 12px; border-radius: 4px; margin-top: 12px;">
          <h5>📈 Learning Patterns for ${pattern.studentName}</h5>
          <p><strong>Best Days for Study:</strong> ${pattern.bestDaysForStudy.join(', ')}</p>
          <p><strong>Best Time Slots:</strong> ${pattern.bestTimeSlots.join(', ')}</p>
          <h5 style="margin-top: 12px;">Pattern Insights:</h5>
          <ul style="padding-left: 20px; font-size: 12px;">
            ${pattern.patternInsights.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      `;
      document.getElementById('p3-pattern-result').innerHTML = html;
    })
    .catch(err => showToast('Error analyzing pattern: ' + err.message, 'error'));
}

function generateParentReportUI() {
  const studentId = document.getElementById('p3-parent-student')?.value;
  if (!studentId) {
    showToast('Please select a student', 'warning');
    return;
  }

  apiCall(`/api/phase3/parent/report/${studentId}`)
    .then(res => {
      const report = res.data;
      const trafficColor = report.trafficLight.overall === 'GREEN' ? '#4caf50' : report.trafficLight.overall === 'YELLOW' ? '#ff9800' : '#f44336';
      const trafficBg = report.trafficLight.overall === 'GREEN' ? '#e8f5e9' : report.trafficLight.overall === 'YELLOW' ? '#fff3e0' : '#ffebee';
      
      let html = `
        <div style="background: ${trafficBg}; border-left: 4px solid ${trafficColor}; padding: 12px; border-radius: 4px; margin-top: 12px;">
          <h5>👨‍👩‍👧 Parent Report: ${report.studentName}</h5>
          <p style="font-size: 12px; color: #666;">${report.reportDate}</p>
          
          <div style="margin: 12px 0;">
            <div style="background: white; padding: 12px; border-radius: 4px; margin-bottom: 8px;">
              <p style="margin: 0;">${report.summary}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 12px;">
            <div style="background: white; padding: 8px; border-radius: 4px;">
              <div style="font-size: 11px; color: #666;">Academic Score</div>
              <div style="font-size: 24px; font-weight: bold; color: #2196f3;">${report.academicScore}%</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 4px;">
              <div style="font-size: 11px; color: #666;">Attendance</div>
              <div style="font-size: 24px; font-weight: bold; color: #4caf50;">${report.attendancePercentage}%</div>
            </div>
          </div>

          <h5 style="margin-top: 12px;">Key Strengths:</h5>
          <ul style="padding-left: 20px; font-size: 12px;">
            ${report.keyStrengths.map(s => `<li>${s}</li>`).join('')}
          </ul>

          <h5 style="margin-top: 12px;">Areas to Support:</h5>
          <ul style="padding-left: 20px; font-size: 12px;">
            ${report.areasToSupport.map(a => `<li>${a}</li>`).join('')}
          </ul>

          <div style="background: white; padding: 8px; border-radius: 4px; margin-top: 12px; font-size: 12px; font-style: italic;">
            ${report.contactTeacher}
          </div>
        </div>
      `;
      document.getElementById('p3-parent-report').innerHTML = html;
      showToast('Parent report generated!', 'success');
    })
    .catch(err => showToast('Error generating parent report: ' + err.message, 'error'));
}

function generateClassParentInsights() {
  const classId = document.getElementById('p3-class-select')?.value;
  if (!classId) {
    showToast('Please select a class', 'warning');
    return;
  }

  apiCall(`/api/phase3/parent/class-insights/${classId}`)
    .then(res => {
      const insights = res.data;
      const html = `
        <div style="background: #f3e5f5; border-left: 4px solid #9c27b0; padding: 12px; border-radius: 4px; margin-top: 12px;">
          <h5>📊 Class Parent Insights</h5>
          <p>${insights.classSummary}</p>
          <p><strong>Class Performance Level:</strong> ${insights.classPerformance}</p>

          ${insights.topPerformers.length > 0 ? `
            <div style="margin-top: 12px; background: #e1bee7; padding: 8px; border-radius: 4px;">
              <h5 style="margin-top: 0;">Top Performers:</h5>
              <ul style="padding-left: 20px; font-size: 12px;">
                ${insights.topPerformers.map(p => `<li>${p.name}: ${p.score}%</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div style="margin-top: 12px; background: #ede7f6; padding: 8px; border-radius: 4px;">
            <h5 style="margin-top: 0;">Weekly Update:</h5>
            <p style="font-size: 12px; margin: 4px 0;"><strong>${insights.parentWeeklyUpdate.title}</strong></p>
            <p style="font-size: 12px; margin: 4px 0;">${insights.parentWeeklyUpdate.message}</p>
            <p style="font-size: 11px; margin: 4px 0;"><strong>Upcoming:</strong> ${insights.parentWeeklyUpdate.upcoming.join(', ')}</p>
          </div>
        </div>
      `;
      document.getElementById('p3-class-parent-insights').innerHTML = html;
      showToast('Class insights loaded!', 'success');
    })
    .catch(err => showToast('Error loading insights: ' + err.message, 'error'));
}

function compareStudentCohort() {
  const studentId = document.getElementById('p3-compare-student')?.value;
  if (!studentId) {
    showToast('Please select a student', 'warning');
    return;
  }

  apiCall(`/api/phase3/comparison/cohort/${studentId}`)
    .then(res => {
      const comp = res.data;
      const html = `
        <div style="background: #ede7f6; border-left: 4px solid #673ab7; padding: 12px; border-radius: 4px; margin-top: 12px;">
          <h5>🎯 Cohort Comparison: ${comp.studentName}</h5>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px;">
            <div style="background: white; padding: 8px; border-radius: 4px; text-align: center;">
              <div style="font-size: 11px; color: #666;">Student Average</div>
              <div style="font-size: 20px; font-weight: bold; color: #673ab7;">${comp.studentAverage}%</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 4px; text-align: center;">
              <div style="font-size: 11px; color: #666;">Class Average</div>
              <div style="font-size: 20px; font-weight: bold; color: #2196f3;">${comp.cohortAverage}%</div>
            </div>
            <div style="background: white; padding: 8px; border-radius: 4px; text-align: center;">
              <div style="font-size: 11px; color: #666;">Percentile</div>
              <div style="font-size: 20px; font-weight: bold; color: #4caf50;">${comp.percentile}%</div>
            </div>
          </div>

          <div style="margin-top: 12px; background: white; padding: 8px; border-radius: 4px;">
            <p style="margin: 0; font-size: 12px;"><strong>Rank:</strong> ${comp.rank.position} out of ${comp.rank.outOf}</p>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Performance:</strong> ${comp.performanceLevel}</p>
            <p style="margin: 4px 0; font-size: 12px;">${comp.analysis}</p>
          </div>

          <div style="margin-top: 12px; background: white; padding: 8px; border-radius: 4px; font-size: 11px;">
            <p><strong>Class Comparison:</strong></p>
            <p>Highest Score: ${comp.classComparison.topPerformer}% | Lowest Score: ${comp.classComparison.bottomPerformer}% | Range: ${comp.classComparison.spreadRange}%</p>
          </div>
        </div>
      `;
      document.getElementById('p3-cohort-comparison').innerHTML = html;
      showToast('Cohort comparison loaded!', 'success');
    })
    .catch(err => showToast('Error loading comparison: ' + err.message, 'error'));
}

// Event Listeners Setup
function setupEventListeners() {
  document.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    switch(action) {
      case 'new-class':
        createClass();
        break;
      case 'add-student':
        addStudent();
        break;
      case 'mark-attendance':
        navigateToPage('attendance');
        break;
      case 'schedule-meeting':
        openScheduleMeetingModal();
        break;
      case 'create-assignment':
        createAssignment();
        break;
      case 'upload-resource':
        uploadResource();
        break;
    }
  });

  document.getElementById('save-attendance')?.addEventListener('click', saveAttendance);
  document.getElementById('save-grades')?.addEventListener('click', saveGrades);

  // Create Assignment modal buttons
  document.getElementById('ca-submit')?.addEventListener('click', submitCreateAssignmentModal);
  document.getElementById('ca-cancel')?.addEventListener('click', closeCreateAssignmentModal);
  // Schedule meeting modal wiring
  document.getElementById('sm-submit')?.addEventListener('click', submitScheduleMeetingModal);
  document.getElementById('sm-cancel')?.addEventListener('click', closeScheduleMeetingModal);

  // Bulk import modal wiring
  document.getElementById('bulk-import-btn')?.addEventListener('click', openBulkImportModal);
  document.getElementById('bi-submit')?.addEventListener('click', submitBulkImport);
  document.getElementById('bi-cancel')?.addEventListener('click', closeBulkImportModal);

  // Generate quiz modal wiring
  document.getElementById('generate-quiz-btn')?.addEventListener('click', openGenerateQuizModal);
  document.getElementById('gq-submit')?.addEventListener('click', submitGenerateQuiz);
  document.getElementById('gq-cancel')?.addEventListener('click', closeGenerateQuizModal);

  // Generate worksheet modal wiring
  document.getElementById('generate-worksheet-btn')?.addEventListener('click', openGenerateWorksheetModal);
  document.getElementById('gw-submit')?.addEventListener('click', submitGenerateWorksheet);
  document.getElementById('gw-cancel')?.addEventListener('click', closeGenerateWorksheetModal);

  // Auth UI
  document.getElementById('btn-login')?.addEventListener('click', showLoginUI);
  document.getElementById('btn-logout')?.addEventListener('click', logout);

  // Communications / resources
  document.getElementById('send-message')?.addEventListener('click', sendMessage);

  // Account request modal
  document.getElementById('req-submit')?.addEventListener('click', submitAccountRequest);
  document.getElementById('req-cancel')?.addEventListener('click', closeAccountModal);

  // ==================== PHASE 2: Smart Classroom ====================
  document.getElementById('p2-class-select')?.addEventListener('change', loadPhase2Dashboard);
  document.getElementById('generate-lesson-btn')?.addEventListener('click', openGenerateLessonModal);
  document.getElementById('suggest-lesson-time-btn')?.addEventListener('click', suggestLessonTime);
  document.getElementById('p2-student-select')?.addEventListener('change', () => {});
  document.getElementById('generate-feedback-btn')?.addEventListener('click', generateStudentFeedback);
  document.getElementById('p2-content-student')?.addEventListener('change', () => {});
  document.getElementById('get-recommendations-btn')?.addEventListener('click', getContentRecommendations);

  // ==================== PHASE 3: Security & Optimization ====================
  document.getElementById('p3-class-select')?.addEventListener('change', loadPhase3Dashboard);
  document.getElementById('optimize-schedule-btn')?.addEventListener('click', optimizeClassSchedule);
  document.getElementById('p3-student-select')?.addEventListener('change', () => {});
  document.getElementById('analyze-pattern-btn')?.addEventListener('click', analyzeStudentPattern);
  document.getElementById('p3-parent-student')?.addEventListener('change', () => {});
  document.getElementById('generate-parent-report-btn')?.addEventListener('click', generateParentReportUI);
  document.getElementById('class-parent-insights-btn')?.addEventListener('click', generateClassParentInsights);
  document.getElementById('p3-compare-student')?.addEventListener('change', () => {});
  document.getElementById('compare-cohort-btn')?.addEventListener('click', compareStudentCohort);
}

// Auto-load dashboard on start
setTimeout(() => {
  navigateToPage('dashboard');
}, 500);
