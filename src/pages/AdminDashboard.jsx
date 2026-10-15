import React, { useState, useEffect } from "react";
import axios from "axios";

function BarChart({ data, color }) {
  if (!data || data.length === 0) return <p style={{ color:"#999", textAlign:"center", padding:"20px" }}>No data yet.</p>;
  const max = Math.max(...data.map(d => Number(d.count)), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height:"130px", padding:"10px 0 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#042954" }}>{d.count}</span>
          <div style={{ width: "100%", backgroundColor: color || "#042954", borderRadius: "4px 4px 0 0",
            height: `${Math.max((Number(d.count) / max) * 100, 4)}px`, transition: "height 0.4s ease" }} />
          <span style={{ fontSize: "9px", color: "#666", textAlign: "center", wordBreak: "break-word", maxWidth: "55px", lineHeight: "1.2" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, departments: 0, invoices: 0, deptChart: [], sectionChart: [], genderChart: [], yearChart: [], semChart: [], payChart: [] });
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState({ name: "", code: "" });
  const [studentList, setStudentList] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: "", roll: "", sec: "", username: "", password: "123", department_id: "", gender: "", year_of_study: "1", semester: "1" });
  const [sectionFilter, setSectionFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [teacherList, setTeacherList] = useState([]);
  const [newTeacher, setNewTeacher] = useState({ username: "", full_name: "", password: "123", email: "", contact_no: "", department_id: "" });
  const [courseList, setCourseList] = useState([]);
  const [newCourse, setNewCourse] = useState({ course_name: "", course_code: "", credits: 3, section: "", teacher_id: "", department_id: "" });
  const [gradeList, setGradeList] = useState([]);
  const [financialList, setFinancialList] = useState([]);
  const [newFinancial, setNewFinancial] = useState({ student_id: "", amount: "", type: "fee", description: "", due_date: "" });
  const [notices, setNotices] = useState([]);
  const [newNotice, setNewNotice] = useState({ title: "", content: "", audience: "all" });
  const [noticeAudienceFilter, setNoticeAudienceFilter] = useState("all");
  const [systemSettings, setSystemSettings] = useState([]);
  const [studentReports, setStudentReports] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState({ paid: [], unpaid: [] });

  const fetchStats = () => axios.get("http://localhost:5000/admin/stats").then(r => {
    const d = r.data || {};
    setStats({
      students: Number(d.students || 0),
      teachers: Number(d.teachers || 0),
      courses: Number(d.courses || 0),
      departments: Number(d.departments || 0),
      invoices: Number(d.invoices || 0),
      deptChart:    Array.isArray(d.deptChart)    ? d.deptChart    : [],
      sectionChart: Array.isArray(d.sectionChart) ? d.sectionChart : [],
      genderChart:  Array.isArray(d.genderChart)  ? d.genderChart  : [],
      yearChart:    Array.isArray(d.yearChart)    ? d.yearChart    : [],
      semChart:     Array.isArray(d.semChart)     ? d.semChart     : [],
      payChart:     Array.isArray(d.payChart)     ? d.payChart     : [],
    });
  });

  const fetchDepts = () => axios.get("http://localhost:5000/departments").then(r => setDepartments(r.data || []));
  const fetchStudents = () => axios.get("http://localhost:5000/admin/students").then(r => setStudentList(r.data || []));
  const fetchTeachers = () => axios.get("http://localhost:5000/admin/teachers").then(r => setTeacherList(r.data || []));
  const fetchCourses = () => axios.get("http://localhost:5000/admin/courses").then(r => setCourseList(r.data || []));
  const fetchGrades = () => axios.get("http://localhost:5000/admin/grades").then(r => setGradeList(r.data || []));
  const fetchFinancial = () => axios.get("http://localhost:5000/admin/financial").then(r => setFinancialList(r.data || []));
  const fetchNotices = () => axios.get("http://localhost:5000/notices").then(r => setNotices(r.data || []));
  const fetchSettings = () => axios.get("http://localhost:5000/admin/settings").then(r => setSystemSettings(r.data || []));
  const fetchReports  = () => axios.get("http://localhost:5000/admin/reports").then(r => setStudentReports(r.data || [])).catch(() => {});
  const fetchPaymentStatus = () => axios.get("http://localhost:5000/admin/payment-status").then(r => setPaymentStatus(r.data || { paid: [], unpaid: [] })).catch(() => {});

  useEffect(() => {
    fetchDepts();
    fetchStats();
    if (activeTab === "students") fetchStudents();
    if (activeTab === "teachers") fetchTeachers();
    if (activeTab === "courses") { fetchCourses(); fetchTeachers(); }
    if (activeTab === "grades") fetchGrades();
    if (activeTab === "financial") { fetchFinancial(); fetchStudents(); }
    if (activeTab === "notices")     fetchNotices();
    if (activeTab === "departments") fetchDepts();
    if (activeTab === "profiles")    { fetchTeachers(); fetchStudents(); }
    if (activeTab === "reports")     fetchReports();
    if (activeTab === "payments")    fetchPaymentStatus();
    if (activeTab === "settings")    fetchSettings();
  }, [activeTab]);

  const handleAddDept = async () => {
    if (!newDept.name || !newDept.code) return alert("Name and code required");
    await axios.post("http://localhost:5000/departments", newDept).catch(e => alert(e.response?.data?.error || "Error"));
    setNewDept({ name: "", code: "" }); fetchDepts(); fetchStats();
  };
  const handleDeleteDept = async (id) => {
    if (!window.confirm("Delete department?")) return;
    await axios.delete(`http://localhost:5000/departments/${id}`);
    fetchDepts(); fetchStats();
  };
  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.roll) return alert("Name and Roll Number required");
    await axios.post("http://localhost:5000/admin/add-student", {
      full_name: newStudent.name, roll_number: newStudent.roll, section: newStudent.sec,
      username: newStudent.username || newStudent.roll, password: newStudent.password,
      department_id: newStudent.department_id || null,
      gender: newStudent.gender || null,
      year_of_study: newStudent.year_of_study || 1,
      semester: newStudent.semester || 1,
    }).catch(e => alert(e.response?.data?.error || "Error"));
    setNewStudent({ name: "", roll: "", sec: "", username: "", password: "123", department_id: "", gender: "", year_of_study: "1", semester: "1" });
    fetchStudents(); fetchStats();
  };
  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    await axios.delete(`http://localhost:5000/admin/students/${id}`);
    fetchStudents(); fetchStats();
  };
  const handleAddTeacher = async () => {
    if (!newTeacher.full_name || !newTeacher.username) return alert("Username and Name required");
    await axios.post("http://localhost:5000/admin/add-teacher", newTeacher).catch(e => alert(e.response?.data?.error || "Error"));
    setNewTeacher({ username: "", full_name: "", password: "123", email: "", contact_no: "", department_id: "" });
    fetchTeachers(); fetchStats();
  };
  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("Delete this teacher?")) return;
    await axios.delete(`http://localhost:5000/admin/teachers/${id}`);
    fetchTeachers(); fetchStats();
  };
  const handleAddCourse = async () => {
    if (!newCourse.course_name || !newCourse.course_code) return alert("Course name and code required");
    await axios.post("http://localhost:5000/admin/add-course", newCourse).catch(e => alert(e.response?.data?.error || "Error"));
    setNewCourse({ course_name: "", course_code: "", credits: 3, section: "", teacher_id: "", department_id: "" });
    fetchCourses(); fetchStats();
  };
  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    await axios.delete(`http://localhost:5000/admin/courses/${id}`);
    fetchCourses(); fetchStats();
  };
  const handleAddFinancial = async () => {
    if (!newFinancial.student_id || !newFinancial.amount) return alert("Student and amount required");
    await axios.post("http://localhost:5000/admin/financial", newFinancial);
    setNewFinancial({ student_id: "", amount: "", type: "fee", description: "", due_date: "" });
    fetchFinancial();
  };
  const handleMarkPaid = async (id, msg) => {
    await axios.put(`http://localhost:5000/admin/financial/${id}`, { status: "paid", payment_message: msg || "Your payment has been confirmed. Thank you!" });
    fetchFinancial();
  };
  const handlePostNotice = async () => {
    if (!newNotice.title || !newNotice.content) return alert("Title and content required");
    await axios.post("http://localhost:5000/notices", { ...newNotice, posted_by: user.id });
    setNewNotice({ title: "", content: "", audience: "all" }); fetchNotices();
  };
  const handleDeleteNotice = async (id) => {
    await axios.delete(`http://localhost:5000/notices/${id}`); fetchNotices();
  };
  const handleToggleSetting = async (key, currentVal) => {
    await axios.put(`http://localhost:5000/admin/settings/${key}`, { value: currentVal ? 0 : 1 });
    fetchSettings();
  };

  // Group students by dept → section
  const groupedStudents = studentList.reduce((acc, s) => {
    const dept = s.department_name || "No Department";
    const sec = s.section || "No Section";
    if (!acc[dept]) acc[dept] = {};
    if (!acc[dept][sec]) acc[dept][sec] = [];
    acc[dept][sec].push(s);
    return acc;
  }, {});

  const filteredStudents = studentList.filter(s =>
    (deptFilter === "all" || s.department_name === deptFilter) &&
    (sectionFilter === "all" || (s.section || "No Section") === sectionFilter)
  );
  const allSections = [...new Set(studentList.map(s => s.section || "No Section"))].sort();
  const allDeptNames = [...new Set(studentList.map(s => s.department_name || "No Department"))].sort();
  const filteredNotices = notices.filter(n => noticeAudienceFilter === "all" || n.audience === noticeAudienceFilter || n.audience === "all");

  const sidebarItems = [
    { key: "dashboard",   icon: "📊", label: "Dashboard" },
    { key: "departments", icon: "🏛️",  label: "Departments" },
    { key: "students",    icon: "👥", label: "Manage Students" },
    { key: "teachers",    icon: "👨‍🏫", label: "Teacher Management" },
    { key: "courses",     icon: "📚", label: "Course Management" },
    { key: "grades",      icon: "💯", label: "Grade Reports" },
    { key: "financial",   icon: "💰", label: "Financial Records" },
    { key: "payments",    icon: "🧾", label: "Payment Status" },
    { key: "notices",     icon: "📢", label: "Notice Board" },
    { key: "profiles",    icon: "🪪", label: "User Profiles" },
    { key: "reports",     icon: "🚨", label: "Student Reports" },
    { key: "settings",    icon: "⚙️", label: "System Settings" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial", backgroundColor: "#f4f7f6" }}>
      <div style={{ width: "260px", backgroundColor: "#042954", color: "white", flexShrink: 0 }}>
        <div style={{ padding: "20px", backgroundColor: "#ffc107", color: "#042954", fontWeight: "bold", textAlign: "center", fontSize: "20px" }}>
          UniFlow ADMIN
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sidebarItems.map(item => (
            <li key={item.key} onClick={() => setActiveTab(item.key)} style={{
              padding: "15px 20px", cursor: "pointer", borderBottom: "1px solid #1a3a5a",
              display: "flex", alignItems: "center", gap: "10px", fontSize: "14px",
              backgroundColor: activeTab === item.key ? "#001f3f" : "transparent",
              color: activeTab === item.key ? "#ffc107" : "white",
              fontWeight: activeTab === item.key ? "bold" : "normal"
            }}>{item.icon} {item.label}</li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ height: "60px", backgroundColor: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 30px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: "#042954", margin: 0 }}>Admin Control Center</h3>
          <div style={{ fontWeight: "bold" }}>👤 {user.full_name || "Administrator"}</div>
        </div>
        <div style={{ padding: "30px" }}>

          {/* ── DASHBOARD ── */}
          {activeTab === "dashboard" && (
            <>
              <div style={{ display: "flex", gap: "16px", marginBottom: "25px", flexWrap: "wrap" }}>
                {[
                  { label: "Departments", value: stats.departments, color: "#ff9800" },
                  { label: "Students", value: stats.students, color: "#2196f3" },
                  { label: "Teachers", value: stats.teachers, color: "#e91e63" },
                  { label: "Courses", value: stats.courses, color: "#4caf50" },
                  { label: "Pending Fees ($)", value: Number(stats.invoices || 0).toFixed(0), color: "#673ab7" },
                ].map(c => (
                  <div key={c.label} style={{ flex: 1, minWidth: "130px", backgroundColor: c.color, color: "white", padding: "20px", borderRadius: "8px", textAlign: "right" }}>
                    <h2 style={{ margin: 0, fontSize: "28px" }}>{c.value}</h2>
                    <p style={{ margin: "4px 0 0", fontSize: "13px" }}>{c.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
                <div style={whiteBox}>
                  <h4 style={boxHeader}>Students per Department</h4>
                  <BarChart data={stats.deptChart} color="#2196f3" />
                </div>
                <div style={whiteBox}>
                  <h4 style={boxHeader}>Students per Section</h4>
                  <BarChart data={stats.sectionChart} color="#4caf50" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
                <div style={whiteBox}>
                  <h4 style={boxHeader}>Students by Gender</h4>
                  <BarChart data={stats.genderChart} color="#e91e63" />
                </div>
                <div style={whiteBox}>
                  <h4 style={boxHeader}>Students by Year</h4>
                  <BarChart data={stats.yearChart} color="#ff9800" />
                </div>
                <div style={whiteBox}>
                  <h4 style={boxHeader}>Students by Semester</h4>
                  <BarChart data={stats.semChart} color="#9c27b0" />
                </div>
                <div style={whiteBox}>
                  <h4 style={boxHeader}>Payment Status</h4>
                  <BarChart data={stats.payChart} color="#00bcd4" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "20px" }}>
                <div style={whiteBox}>
                  <h4 style={boxHeader}>Quick Operations</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    {[["Departments","departments"],["Add Student","students"],["Teachers","teachers"],
                      ["Courses","courses"],["Financials","financial"],["Notices","notices"]].map(([label, tab]) => (
                      <button key={tab} onClick={() => setActiveTab(tab)} style={opBtn}>{label}</button>
                    ))}
                  </div>
                </div>
                <div style={whiteBox}>
                  <h4 style={boxHeader}>System Status</h4>
                  <div style={{ color: "green", fontSize: "14px", marginBottom: "8px" }}>● Database Connected</div>
                  <div style={{ color: "green", fontSize: "14px", marginBottom: "8px" }}>● Server Online</div>
                  <div style={{ fontSize: "13px", color: "#555", marginTop: "10px", lineHeight: "1.8" }}>
                    <div>Departments: <strong>{stats.departments}</strong></div>
                    <div>Total Students: <strong>{stats.students}</strong></div>
                    <div>Total Teachers: <strong>{stats.teachers}</strong></div>
                    <div>Total Courses: <strong>{stats.courses}</strong></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── DEPARTMENTS ── */}
          {activeTab === "departments" && (
            <div style={whiteBox}>
              <h3 style={boxHeader}>🏛️ Department Management</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input style={inputStyle} placeholder="Department Name *" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} />
                <input style={{...inputStyle, maxWidth:"120px"}} placeholder="Code * e.g. CS" value={newDept.code} onChange={e => setNewDept({...newDept, code: e.target.value})} />
                <button style={addBtn} onClick={handleAddDept}>+ Add Department</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "15px" }}>
                {departments.length === 0
                  ? <p style={{ color: "#999" }}>No departments yet.</p>
                  : departments.map(d => (
                    <div key={d.id} style={{ padding: "20px", backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "8px", borderTop: "4px solid #042954" }}>
                      <h4 style={{ margin: "0 0 6px", color: "#042954" }}>{d.name}</h4>
                      <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#888" }}>Code: <strong>{d.code}</strong></p>
                      <button onClick={() => handleDeleteDept(d.id)} style={delBtn}>Delete</button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── STUDENTS ── */}
          {activeTab === "students" && (
            <div style={whiteBox}>
              <h3 style={boxHeader}>👥 Student Management</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", padding: "15px", backgroundColor: "#f8faff", borderRadius: "8px", border: "1px solid #e1e8f0" }}>
                <input style={inputStyle} placeholder="Full Name *" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                <input style={inputStyle} placeholder="Roll Number *" value={newStudent.roll} onChange={e => setNewStudent({...newStudent, roll: e.target.value})} />
                <input style={inputStyle} placeholder="Section e.g. A" value={newStudent.sec} onChange={e => setNewStudent({...newStudent, sec: e.target.value})} />
                <input style={inputStyle} placeholder="Username (default: roll no)" value={newStudent.username} onChange={e => setNewStudent({...newStudent, username: e.target.value})} />
                <input style={inputStyle} placeholder="Password" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} />
                <select style={inputStyle} value={newStudent.department_id} onChange={e => setNewStudent({...newStudent, department_id: e.target.value})}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select style={inputStyle} value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value})}>
                  <option value="">Gender</option>
                  <option value="Male">Male (M)</option>
                  <option value="Female">Female (F)</option>
                </select>
                <select style={inputStyle} value={newStudent.year_of_study} onChange={e => setNewStudent({...newStudent, year_of_study: e.target.value})}>
                  <option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option>
                </select>
                <select style={inputStyle} value={newStudent.semester} onChange={e => setNewStudent({...newStudent, semester: e.target.value})}>
                  <option value="1">Semester 1</option><option value="2">Semester 2</option>
                </select>
                <button style={addBtn} onClick={handleAddStudent}>+ Add Student</button>
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#666" }}>Filter:</span>
                <select style={selectSm} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                  <option value="all">All Departments</option>
                  {allDeptNames.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select style={selectSm} value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                  <option value="all">All Sections</option>
                  {allSections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: "13px", color: "#888" }}>{filteredStudents.length} student(s)</span>
              </div>

              {deptFilter === "all" && sectionFilter === "all" ? (
                Object.keys(groupedStudents).length === 0
                  ? <p style={emptyTd}>No students yet.</p>
                  : Object.entries(groupedStudents).map(([dept, sections]) => (
                    <div key={dept} style={{ marginBottom: "25px" }}>
                      <h4 style={{ color: "#042954", borderBottom: "2px solid #ffc107", paddingBottom: "6px", marginBottom: "12px" }}>🏛️ {dept}</h4>
                      {Object.entries(sections).map(([sec, students]) => (
                        <div key={sec} style={{ marginBottom: "15px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <span style={{ backgroundColor: "#042954", color: "white", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" }}>Section {sec}</span>
                            <span style={{ fontSize: "12px", color: "#888" }}>{students.length} student(s)</span>
                          </div>
                          <table style={tableStyle}>
                            <thead><tr style={theadRow}>
                              <th style={th}>#</th><th style={th}>Name</th><th style={th}>Roll No</th>
                              <th style={th}>Username</th><th style={th}>Email</th><th style={th}>Action</th>
                            </tr></thead>
                            <tbody>
                              {students.map((s, i) => (
                                <tr key={s.id}>
                                  <td style={td}>{i+1}</td><td style={td}>{s.full_name}</td>
                                  <td style={td}>{s.roll_number}</td><td style={td}>{s.username}</td>
                                  <td style={td}>{s.email || "—"}</td>
                                  <td style={td}><button onClick={() => handleDeleteStudent(s.id)} style={delBtn}>Delete</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ))
              ) : (
                filteredStudents.length === 0
                  ? <p style={emptyTd}>No students match the filter.</p>
                  : (
                    <table style={tableStyle}>
                      <thead><tr style={theadRow}>
                        <th style={th}>#</th><th style={th}>Name</th><th style={th}>Roll No</th>
                        <th style={th}>Department</th><th style={th}>Section</th><th style={th}>Action</th>
                      </tr></thead>
                      <tbody>
                        {filteredStudents.map((s, i) => (
                          <tr key={s.id}>
                            <td style={td}>{i+1}</td><td style={td}>{s.full_name}</td>
                            <td style={td}>{s.roll_number}</td><td style={td}>{s.department_name || "—"}</td>
                            <td style={td}>{s.section || "—"}</td>
                            <td style={td}><button onClick={() => handleDeleteStudent(s.id)} style={delBtn}>Delete</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
              )}
            </div>
          )}

          {/* ── TEACHERS ── */}
          {activeTab === "teachers" && (
            <div style={whiteBox}>
              <h3 style={boxHeader}>👨‍🏫 Teacher Management</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input style={inputStyle} placeholder="Username *" value={newTeacher.username} onChange={e => setNewTeacher({...newTeacher, username: e.target.value})} />
                <input style={inputStyle} placeholder="Full Name *" value={newTeacher.full_name} onChange={e => setNewTeacher({...newTeacher, full_name: e.target.value})} />
                <input style={inputStyle} placeholder="Email" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} />
                <input style={inputStyle} placeholder="Contact No" value={newTeacher.contact_no} onChange={e => setNewTeacher({...newTeacher, contact_no: e.target.value})} />
                <input style={inputStyle} placeholder="Password" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} />
                <select style={inputStyle} value={newTeacher.department_id} onChange={e => setNewTeacher({...newTeacher, department_id: e.target.value})}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <button style={addBtn} onClick={handleAddTeacher}>+ Add Teacher</button>
              </div>
              <table style={tableStyle}>
                <thead><tr style={theadRow}>
                  <th style={th}>#</th><th style={th}>Name</th><th style={th}>Username</th>
                  <th style={th}>Department</th><th style={th}>Email</th><th style={th}>Action</th>
                </tr></thead>
                <tbody>
                  {teacherList.length === 0
                    ? <tr><td colSpan="6" style={emptyTd}>No teachers yet.</td></tr>
                    : teacherList.map((t, i) => (
                      <tr key={t.id}>
                        <td style={td}>{i+1}</td><td style={td}>{t.full_name}</td>
                        <td style={td}>{t.username}</td><td style={td}>{t.department_name || "—"}</td>
                        <td style={td}>{t.email || "—"}</td>
                        <td style={td}><button onClick={() => handleDeleteTeacher(t.id)} style={delBtn}>Delete</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── COURSES ── */}
          {activeTab === "courses" && (
            <div style={whiteBox}>
              <h3 style={boxHeader}>📚 Course Management</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input style={inputStyle} placeholder="Course Name *" value={newCourse.course_name} onChange={e => setNewCourse({...newCourse, course_name: e.target.value})} />
                <input style={inputStyle} placeholder="Course Code *" value={newCourse.course_code} onChange={e => setNewCourse({...newCourse, course_code: e.target.value})} />
                <input style={{...inputStyle, maxWidth:"80px"}} placeholder="Credits" type="number" value={newCourse.credits} onChange={e => setNewCourse({...newCourse, credits: e.target.value})} />
                <input style={inputStyle} placeholder="Section" value={newCourse.section} onChange={e => setNewCourse({...newCourse, section: e.target.value})} />
                <select style={inputStyle} value={newCourse.department_id} onChange={e => setNewCourse({...newCourse, department_id: e.target.value})}>
                  <option value="">Department *</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select style={inputStyle} value={newCourse.teacher_id} onChange={e => setNewCourse({...newCourse, teacher_id: e.target.value})}>
                  <option value="">Assign Teacher</option>
                  {teacherList.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
                <button style={addBtn} onClick={handleAddCourse}>+ Add Course</button>
              </div>
              <table style={tableStyle}>
                <thead><tr style={theadRow}>
                  <th style={th}>#</th><th style={th}>Course</th><th style={th}>Code</th>
                  <th style={th}>Department</th><th style={th}>Credits</th><th style={th}>Section</th>
                  <th style={th}>Teacher</th><th style={th}>Action</th>
                </tr></thead>
                <tbody>
                  {courseList.length === 0
                    ? <tr><td colSpan="8" style={emptyTd}>No courses yet.</td></tr>
                    : courseList.map((c, i) => (
                      <tr key={c.id}>
                        <td style={td}>{i+1}</td><td style={td}>{c.course_name}</td>
                        <td style={td}>{c.course_code}</td><td style={td}>{c.department_name || "—"}</td>
                        <td style={td}>{c.credits}</td><td style={td}>{c.section || "—"}</td>
                        <td style={td}>{c.teacher_name || "Unassigned"}</td>
                        <td style={td}><button onClick={() => handleDeleteCourse(c.id)} style={delBtn}>Delete</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── GRADES ── */}
          {activeTab === "grades" && (
            <div style={whiteBox}>
              <h3 style={boxHeader}>💯 Global Grade Report</h3>
              <table style={tableStyle}>
                <thead><tr style={theadRow}>
                  <th style={th}>#</th><th style={th}>Student</th><th style={th}>Roll No</th>
                  <th style={th}>Course</th><th style={th}>Grade</th><th style={th}>Marks</th><th style={th}>Remarks</th>
                </tr></thead>
                <tbody>
                  {gradeList.length === 0
                    ? <tr><td colSpan="7" style={emptyTd}>No grades recorded yet.</td></tr>
                    : gradeList.map((g, i) => (
                      <tr key={g.id}>
                        <td style={td}>{i+1}</td><td style={td}>{g.full_name}</td>
                        <td style={td}>{g.roll_number}</td><td style={td}>{g.course_name}</td>
                        <td style={{...td, fontWeight:"bold", color:"#042954"}}>{g.grade}</td>
                        <td style={td}>{g.marks}</td><td style={td}>{g.remarks || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── FINANCIAL ── */}
          {activeTab === "financial" && (
            <div style={whiteBox}>
              <h3 style={boxHeader}>💰 Financial Records</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <select style={inputStyle} value={newFinancial.student_id} onChange={e => setNewFinancial({...newFinancial, student_id: e.target.value})}>
                  <option value="">Select Student *</option>
                  {studentList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</option>)}
                </select>
                <input style={inputStyle} placeholder="Amount *" type="number" value={newFinancial.amount} onChange={e => setNewFinancial({...newFinancial, amount: e.target.value})} />
                <select style={inputStyle} value={newFinancial.type} onChange={e => setNewFinancial({...newFinancial, type: e.target.value})}>
                  <option value="fee">Fee</option><option value="fine">Fine</option><option value="scholarship">Scholarship</option>
                </select>
                <input style={inputStyle} placeholder="Description" value={newFinancial.description} onChange={e => setNewFinancial({...newFinancial, description: e.target.value})} />
                <input style={inputStyle} type="date" value={newFinancial.due_date} onChange={e => setNewFinancial({...newFinancial, due_date: e.target.value})} />
                <select style={inputStyle} value={newFinancial.semester || ""} onChange={e => setNewFinancial({...newFinancial, semester: e.target.value})}>
                  <option value="">Semester</option><option value="1">Semester 1</option><option value="2">Semester 2</option>
                </select>
                <select style={inputStyle} value={newFinancial.year_of_study || ""} onChange={e => setNewFinancial({...newFinancial, year_of_study: e.target.value})}>
                  <option value="">Year</option><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option>
                </select>
                <button style={addBtn} onClick={handleAddFinancial}>+ Add Record</button>
              </div>
              <table style={tableStyle}>
                <thead><tr style={theadRow}>
                  <th style={th}>Student</th><th style={th}>Roll No</th><th style={th}>Amount</th>
                  <th style={th}>Type</th><th style={th}>Sem/Year</th><th style={th}>Status</th><th style={th}>Receipt</th><th style={th}>Action</th>
                </tr></thead>
                <tbody>
                  {financialList.length === 0
                    ? <tr><td colSpan="8" style={emptyTd}>No records yet.</td></tr>
                    : financialList.map(f => (
                      <tr key={f.id}>
                        <td style={td}>{f.full_name}</td><td style={td}>{f.roll_number}</td>
                        <td style={td}>$ {f.amount}</td><td style={td}>{f.type}</td>
                        <td style={td}>{f.semester ? `S${f.semester}/Y${f.year_of_study}` : "—"}</td>
                        <td style={td}>
                          <span style={{ padding:"3px 8px", borderRadius:"4px", fontSize:"12px",
                            backgroundColor: f.status==="paid"?"#e8f5e9":f.status==="overdue"?"#fdecea":"#fff8e1",
                            color: f.status==="paid"?"#2e7d32":f.status==="overdue"?"#c62828":"#f57f17" }}>
                            {f.status}
                          </span>
                        </td>
                        <td style={td}>
                          {f.receipt_submitted && f.receipt_image
                            ? <img src={f.receipt_image} alt="receipt" style={{ width: "60px", height: "50px", objectFit: "cover", borderRadius: "4px", cursor: "pointer" }}
                                onClick={() => window.open(f.receipt_image, '_blank')} />
                            : <span style={{ fontSize: "12px", color: "#aaa" }}>None</span>}
                        </td>
                        <td style={td}>
                          {f.status !== "paid" && f.receipt_submitted && (
                            <button onClick={() => {
                              const msg = prompt("Enter confirmation message to student:", "Your payment has been confirmed. Thank you!");
                              if (msg !== null) handleMarkPaid(f.id, msg);
                            }} style={{...opBtn, fontSize:"11px", padding:"5px 10px", backgroundColor:"#4caf50"}}>
                              ✅ Confirm Paid
                            </button>
                          )}
                          {f.status !== "paid" && !f.receipt_submitted && (
                            <button onClick={() => handleMarkPaid(f.id, "Your payment has been confirmed by admin.")}
                              style={{...opBtn, fontSize:"11px", padding:"5px 10px"}}>Mark Paid</button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PAYMENT STATUS ── */}
          {activeTab === "payments" && (
            <div>
              <div style={whiteBox}>
                <h3 style={boxHeader}>✅ Paid Students</h3>
                {paymentStatus.paid.length === 0
                  ? <p style={{ color: "#999", textAlign: "center" }}>No paid records yet.</p>
                  : <table style={tableStyle}>
                      <thead><tr style={theadRow}>
                        <th style={th}>Student ID</th><th style={th}>Name</th><th style={th}>Roll No</th>
                        <th style={th}>Department</th><th style={th}>Amount</th><th style={th}>Sem/Year</th><th style={th}>Date</th>
                      </tr></thead>
                      <tbody>
                        {paymentStatus.paid.map((p, i) => (
                          <tr key={i}>
                            <td style={td}>{p.student_id_no || "—"}</td>
                            <td style={td}>{p.full_name}</td>
                            <td style={td}>{p.roll_number}</td>
                            <td style={td}>{p.department_name || "—"}</td>
                            <td style={td}>$ {p.amount}</td>
                            <td style={td}>{p.semester ? `S${p.semester}/Y${p.year_of_study}` : "—"}</td>
                            <td style={td}>{new Date(p.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>}
              </div>
              <div style={whiteBox}>
                <h3 style={boxHeader}>⏳ Unpaid Students</h3>
                {paymentStatus.unpaid.length === 0
                  ? <p style={{ color: "#999", textAlign: "center" }}>All students have paid!</p>
                  : <table style={tableStyle}>
                      <thead><tr style={theadRow}>
                        <th style={th}>Student ID</th><th style={th}>Name</th><th style={th}>Roll No</th>
                        <th style={th}>Department</th><th style={th}>Amount</th><th style={th}>Sem/Year</th><th style={th}>Due Date</th>
                      </tr></thead>
                      <tbody>
                        {paymentStatus.unpaid.map((p, i) => (
                          <tr key={i}>
                            <td style={td}>{p.student_id_no || "—"}</td>
                            <td style={td}>{p.full_name}</td>
                            <td style={td}>{p.roll_number}</td>
                            <td style={td}>{p.department_name || "—"}</td>
                            <td style={{ ...td, color: "#c62828", fontWeight: "bold" }}>$ {p.amount}</td>
                            <td style={td}>{p.semester ? `S${p.semester}/Y${p.year_of_study}` : "—"}</td>
                            <td style={td}>{p.due_date ? new Date(p.due_date).toLocaleDateString() : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>}
              </div>
            </div>
          )}

          {/* ── NOTICES ── */}
          {activeTab === "notices" && (
            <div style={whiteBox}>
              <h3 style={boxHeader}>📢 Notice Board</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", padding: "15px", backgroundColor: "#f8faff", borderRadius: "8px", border: "1px solid #e1e8f0" }}>
                <input style={{...inputStyle, flex:2}} placeholder="Notice Title *" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} />
                <input style={{...inputStyle, flex:3}} placeholder="Content *" value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} />
                <select style={{...inputStyle, flex:1}} value={newNotice.audience} onChange={e => setNewNotice({...newNotice, audience: e.target.value})}>
                  <option value="all">📣 Everyone</option>
                  <option value="student">🎓 Students Only</option>
                  <option value="teacher">👨‍🏫 Teachers Only</option>
                </select>
                <button style={addBtn} onClick={handlePostNotice}>+ Post</button>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {[["all","All"],["student","Students"],["teacher","Teachers"]].map(([val, label]) => (
                  <button key={val} onClick={() => setNoticeAudienceFilter(val)} style={{
                    padding: "7px 18px", border: "none", borderRadius: "20px", cursor: "pointer", fontSize: "13px",
                    backgroundColor: noticeAudienceFilter === val ? "#042954" : "#eee",
                    color: noticeAudienceFilter === val ? "white" : "#555"
                  }}>{label}</button>
                ))}
              </div>
              {filteredNotices.length === 0
                ? <p style={{ color: "#999", textAlign: "center" }}>No notices for this audience.</p>
                : filteredNotices.map(n => (
                  <div key={n.id} style={{ padding: "15px", backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "8px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "bold", color: "#042954" }}>{n.title}</span>
                        <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px",
                          backgroundColor: n.audience==="student"?"#e3f2fd":n.audience==="teacher"?"#f3e5f5":"#e8f5e9",
                          color: n.audience==="student"?"#1565c0":n.audience==="teacher"?"#6a1b9a":"#2e7d32" }}>
                          {n.audience === "all" ? "Everyone" : n.audience === "student" ? "Students" : "Teachers"}
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#444", margin: "5px 0" }}>{n.content}</p>
                      <small style={{ color: "#888" }}>{new Date(n.created_at).toLocaleDateString()}</small>
                    </div>
                    <button onClick={() => handleDeleteNotice(n.id)} style={delBtn}>Delete</button>
                  </div>
                ))}
            </div>
          )}

          {/* ── SYSTEM SETTINGS ── */}
          {activeTab === "settings" && (
            <div style={whiteBox}>
              <h3 style={boxHeader}>⚙️ System Settings</h3>
              <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
                Control what is allowed in the system. Toggle any feature on or off instantly.
              </p>
              {systemSettings.length === 0
                ? <p style={{ color: "#999", textAlign: "center" }}>No settings found. Make sure you ran the system_settings SQL.</p>
                : systemSettings.map(s => (
                  <div key={s.setting_key} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 20px", marginBottom: "10px", backgroundColor: "#f8faff",
                    border: "1px solid #e1e8f0", borderRadius: "8px",
                    borderLeft: `4px solid ${s.setting_value ? "#4caf50" : "#e53935"}`
                  }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#042954", fontSize: "15px" }}>{s.label}</div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>{s.description}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "bold", color: s.setting_value ? "#4caf50" : "#e53935" }}>
                        {s.setting_value ? "ON" : "OFF"}
                      </span>
                      <div onClick={() => handleToggleSetting(s.setting_key, s.setting_value)} style={{
                        width: "50px", height: "26px", borderRadius: "13px", cursor: "pointer",
                        backgroundColor: s.setting_value ? "#4caf50" : "#ccc",
                        position: "relative", transition: "background-color 0.3s", flexShrink: 0
                      }}>
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "white",
                          position: "absolute", top: "3px",
                          left: s.setting_value ? "27px" : "3px",
                          transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              <hr style={{ border: "0.5px solid #eee", margin: "20px 0" }} />
              <p style={{ color: "#888", fontSize: "13px" }}>Logged in as: <strong>{user.full_name}</strong> — UniFlow v1.0</p>
            </div>
          )}

          {/* ── USER PROFILES ── */}
          {activeTab === "profiles" && (
            <div>
              {/* Teachers */}
              <div style={whiteBox}>
                <h3 style={boxHeader}>👨‍🏫 Teacher Profiles</h3>
                {teacherList.length === 0
                  ? <p style={{ color: "#999", textAlign: "center" }}>No teachers found.</p>
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
                      {teacherList.map(t => {
                        const photo = localStorage.getItem(`profile_photo_${t.id}`);
                        return (
                          <div key={t.id} style={{ backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "10px", padding: "20px 15px", textAlign: "center", borderTop: "4px solid #673ab7" }}>
                            <div style={{ width: "72px", height: "72px", borderRadius: "50%", border: "3px solid #673ab7", overflow: "hidden", backgroundColor: "#e8eaf6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                              {photo
                                ? <img src={photo} alt={t.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontSize: "30px" }}>👤</span>}
                            </div>
                            <div style={{ fontWeight: "bold", color: "#042954", fontSize: "14px" }}>{t.full_name}</div>
                            <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{t.department_name || "—"}</div>
                            <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{t.email || "—"}</div>
                          </div>
                        );
                      })}
                    </div>}
              </div>

              {/* Students */}
              <div style={whiteBox}>
                <h3 style={boxHeader}>👥 Student Profiles</h3>
                {studentList.length === 0
                  ? <p style={{ color: "#999", textAlign: "center" }}>No students found.</p>
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
                      {studentList.map(s => {
                        const photo = localStorage.getItem(`profile_photo_${s.id}`);
                        return (
                          <div key={s.id} style={{ backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "10px", padding: "20px 15px", textAlign: "center", borderTop: "4px solid #2196f3" }}>
                            <div style={{ width: "72px", height: "72px", borderRadius: "50%", border: "3px solid #2196f3", overflow: "hidden", backgroundColor: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                              {photo
                                ? <img src={photo} alt={s.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontSize: "30px" }}>👤</span>}
                            </div>
                            <div style={{ fontWeight: "bold", color: "#042954", fontSize: "14px" }}>{s.full_name}</div>
                            <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Roll: {s.roll_number}</div>
                            <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>Section: {s.section || "—"}</div>
                          </div>
                        );
                      })}
                    </div>}
              </div>
            </div>
          )}

          {/* ── STUDENT REPORTS ── */}
          {activeTab === "reports" && (
            <div style={whiteBox}>
              <h3 style={boxHeader}>🚨 Student Reports</h3>
              {studentReports.length === 0
                ? <p style={{ color: "#999", textAlign: "center", padding: "30px 0" }}>No reports submitted yet.</p>
                : studentReports.map(r => (
                  <div key={r.id} style={{
                    padding: "18px 20px", marginBottom: "12px", borderRadius: "8px",
                    border: "1px solid #e1e8f0", backgroundColor: r.status === "unread" ? "#fffde7" : "#f8faff",
                    borderLeft: `5px solid ${r.status === "unread" ? "#ffc107" : "#4caf50"}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#888", marginRight: "10px" }}>{r.category}</span>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", backgroundColor: r.status === "unread" ? "#fff8e1" : "#e8f5e9", color: r.status === "unread" ? "#f57f17" : "#2e7d32", fontWeight: "bold" }}>
                          {r.status === "unread" ? "● New" : "✓ Read"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {r.status === "unread" && (
                          <button onClick={async () => { await axios.put(`http://localhost:5000/admin/reports/${r.id}/read`); fetchReports(); }}
                            style={{ padding: "4px 12px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                            Mark Read
                          </button>
                        )}
                        <button onClick={async () => { if (window.confirm("Delete this report?")) { await axios.delete(`http://localhost:5000/admin/reports/${r.id}`); fetchReports(); } }}
                          style={{ padding: "4px 12px", backgroundColor: "#e53935", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ fontWeight: "bold", color: "#042954", fontSize: "15px", margin: "10px 0 4px" }}>{r.subject}</div>
                    <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#444", lineHeight: "1.6" }}>{r.message}</p>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      From: <strong>{r.student_name || "Unknown"}</strong> (Roll: {r.roll_number || "—"}) &nbsp;·&nbsp; {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const whiteBox = { backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", marginBottom: "20px", flex: 1 };
const boxHeader = { marginTop: 0, marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" };
const opBtn = { padding: "10px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const addBtn = { padding: "10px 20px", backgroundColor: "#042954", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap" };
const delBtn = { padding: "5px 12px", backgroundColor: "#e53935", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const inputStyle = { flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #ddd", minWidth: "120px" };
const selectSm = { padding: "8px 10px", borderRadius: "4px", border: "1px solid #ddd", fontSize: "13px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const theadRow = { textAlign: "left", borderBottom: "2px solid #eee", backgroundColor: "#f9f9f9" };
const th = { padding: "10px 12px", color: "#666", fontSize: "13px" };
const td = { padding: "10px 12px", fontSize: "14px", borderBottom: "1px solid #f5f5f5" };
const emptyTd = { padding: "20px", textAlign: "center", color: "#999" };

export default AdminDashboard;