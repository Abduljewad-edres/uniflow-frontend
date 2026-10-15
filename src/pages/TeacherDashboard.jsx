import React, { useState, useEffect } from "react";
import axios from "axios";

function ProfileTab({ user, role, fields }) {
  const storageKey = `profile_photo_${user?.id || role}`;
  const [photo, setPhoto] = useState(() => localStorage.getItem(storageKey) || null);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      localStorage.setItem(storageKey, ev.target.result);
      setPhoto(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    localStorage.removeItem(storageKey);
    setPhoto(null);
  };

  return (
    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
      <h3 style={{ marginTop: 0, fontSize: "18px", color: "#042954", borderBottom: "2px solid #f0f1f3", paddingBottom: "12px" }}>👤 My Profile</h3>
      <div style={{ display: "flex", gap: "30px", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Photo section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "120px", height: "120px", borderRadius: "50%", border: "3px solid #042954", overflow: "hidden", backgroundColor: "#f0f1f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {photo
              ? <img src={photo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "48px" }}>👤</span>}
          </div>
          <label style={{ padding: "8px 16px", backgroundColor: "#042954", color: "white", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}>
            {photo ? "Change Photo" : "Upload Photo"}
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
          </label>
          {photo && (
            <button onClick={handleRemove} style={{ padding: "6px 14px", backgroundColor: "#e53935", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
              Remove
            </button>
          )}
        </div>
        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", flex: 1, minWidth: "260px" }}>
          {fields.map(([label, value]) => (
            <div key={label} style={{ padding: "12px", backgroundColor: "#f8faff", borderRadius: "6px", border: "1px solid #e1e8f0" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#888", textTransform: "uppercase" }}>{label}</p>
              <p style={{ margin: "4px 0 0", fontWeight: "bold", color: "#042954" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const user = JSON.parse(localStorage.getItem("user")) || { full_name: "Teacher" };
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats]         = useState({ courses: 0, attendancePct: 0, submissionPct: 0 });
  const [courses, setCourses]     = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents]   = useState([]);

  // Attendance
  const [attendanceDate, setAttendanceDate]     = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);

  // Grades
  const [gradeList, setGradeList]   = useState([]);
  const [gradeInputs, setGradeInputs] = useState({});

  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", due_date: "" });

  // Notices
  const [notices, setNotices]       = useState([]);

  // --- Fetchers ---
  const fetchStats       = () => axios.get(`http://localhost:5000/teacher/stats/${user.id}`).then(r => setStats(r.data)).catch(() => {});
  const fetchCourses     = () => axios.get(`http://localhost:5000/teacher/courses/${user.id}`).then(r => setCourses(r.data)).catch(() => {});
  const fetchNotices     = () => axios.get("http://localhost:5000/notices?audience=teacher").then(r => setNotices(r.data)).catch(() => {});

  const fetchStudents = (courseId) =>
    axios.get(`http://localhost:5000/teacher/students/${courseId}`).then(r => {
      setStudents(r.data);
      // pre-fill attendance as present
      setAttendanceRecords(r.data.map(s => ({ student_id: s.id, status: "present" })));
    }).catch(() => {});

  const fetchAttendanceSummary = (courseId) =>
    axios.get(`http://localhost:5000/teacher/attendance-summary/${courseId}`).then(r => setAttendanceSummary(r.data)).catch(() => {});

  const fetchGrades = (courseId) =>
    axios.get(`http://localhost:5000/teacher/grades/${courseId}`).then(r => setGradeList(r.data)).catch(() => {});

  const fetchAssignments = (courseId) =>
    axios.get(`http://localhost:5000/teacher/assignments/${courseId}`).then(r => setAssignments(r.data)).catch(() => {});

  useEffect(() => {
    fetchStats();
    fetchCourses();
    fetchNotices();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    if (activeTab === "students")    fetchStudents(selectedCourse);
    if (activeTab === "attendance")  { fetchStudents(selectedCourse); fetchAttendanceSummary(selectedCourse); }
    if (activeTab === "grades")      { fetchGrades(selectedCourse); fetchStudents(selectedCourse); }
    if (activeTab === "assignments") fetchAssignments(selectedCourse);
  }, [activeTab, selectedCourse]);

  // Auto-select first course when courses load
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) setSelectedCourse(String(courses[0].id));
  }, [courses]);

  // --- Handlers ---
  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r));
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourse) return alert("Select a course first");
    const check = await axios.get("http://localhost:5000/settings/allow_attendance_marking").catch(() => ({ data: { enabled: true } }));
    if (!check.data.enabled) return alert("Attendance marking is currently closed by the administrator.");
    await axios.post("http://localhost:5000/teacher/attendance", {
      records: attendanceRecords, course_id: selectedCourse,
      date: attendanceDate, marked_by: user.id
    });
    alert("Attendance saved!");
    fetchAttendanceSummary(selectedCourse);
    fetchStats();
  };

  const handleGradeChange = (studentId, field, value) => {
    setGradeInputs(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handleSaveGrade = async (studentId) => {
    const g = gradeInputs[studentId];
    if (!g?.grade) return alert("Enter a grade first");
    const check = await axios.get("http://localhost:5000/settings/allow_grade_submission").catch(() => ({ data: { enabled: true } }));
    if (!check.data.enabled) return alert("Grade submission is currently closed by the administrator.");
    await axios.post("http://localhost:5000/teacher/grades", {
      student_id: studentId, course_id: selectedCourse,
      grade: g.grade, marks: g.marks || null, remarks: g.remarks || null
    });
    fetchGrades(selectedCourse);
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.title) return alert("Title is required");
    await axios.post("http://localhost:5000/teacher/assignments", {
      ...newAssignment, course_id: selectedCourse, teacher_id: user.id
    });
    setNewAssignment({ title: "", description: "", due_date: "" });
    fetchAssignments(selectedCourse);
  };

  const sidebarItems = [
    { key: "dashboard",   icon: "📊", label: "Dashboard" },
    { key: "students",    icon: "👥", label: "Students" },
    { key: "courses",     icon: "📚", label: "My Courses" },
    { key: "assignments", icon: "📝", label: "Assignments" },
    { key: "grades",      icon: "💯", label: "Grade" },
    { key: "attendance",  icon: "📅", label: "Attendance" },
    { key: "notices",     icon: "📢", label: "Notices" },
    { key: "profile",     icon: "👤", label: "Profile" },
  ];

  // Course selector shown on tabs that need it
  const CourseSelector = () => (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ fontSize: "13px", color: "#666", marginRight: "10px" }}>Select Course:</label>
      <select style={selectStyle} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
        {courses.map(c => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial", backgroundColor: "#f0f1f3" }}>

      {/* SIDEBAR */}
      <div style={{ width: "240px", backgroundColor: "#042954", color: "white", flexShrink: 0 }}>
        <div style={{ padding: "20px", backgroundColor: "#673ab7", color: "white", fontWeight: "bold", textAlign: "center", fontSize: "20px" }}>
          UniFlow <span style={{ fontSize: "12px" }}>TEACHER</span>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sidebarItems.map(item => (
            <li key={item.key} onClick={() => setActiveTab(item.key)} style={{
              padding: "15px 25px", cursor: "pointer", borderBottom: "1px solid #05366d",
              fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
              backgroundColor: activeTab === item.key ? "#001f3f" : "transparent",
              color: activeTab === item.key ? "#ffc107" : "white",
              fontWeight: activeTab === item.key ? "bold" : "normal"
            }}>
              {item.icon} {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 30px", height: "60px", backgroundColor: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: 0, color: "#042954" }}>Instructor Dashboard</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontWeight: "bold" }}>👤 {user.full_name}</span>
          </div>
        </div>

        <div style={{ padding: "30px" }}>

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
                <div style={{ ...statCard, backgroundColor: "#fff0da", borderTop: "5px solid #ff9800" }}>
                  <h3 style={{ color: "#ff9800", fontSize: "30px", margin: 0 }}>{stats.courses}</h3>
                  <p style={{ color: "#ff9800", margin: "5px 0" }}>Courses Assigned</p>
                </div>
                <div style={{ ...statCard, backgroundColor: "#fdeced", borderTop: "5px solid #e91e63" }}>
                  <h3 style={{ color: "#e91e63", fontSize: "30px", margin: 0 }}>{stats.attendancePct}%</h3>
                  <p style={{ color: "#e91e63", margin: "5px 0" }}>Today's Attendance</p>
                </div>
                <div style={{ ...statCard, backgroundColor: "#e2f8f9", borderTop: "5px solid #00bcd4" }}>
                  <h3 style={{ color: "#00bcd4", fontSize: "30px", margin: 0 }}>{stats.submissionPct}%</h3>
                  <p style={{ color: "#00bcd4", margin: "5px 0" }}>Assignment Submissions</p>
                </div>
                <div style={{ ...statCard, backgroundColor: "#ecfaed", borderTop: "5px solid #4caf50" }}>
                  <h3 style={{ color: "#4caf50", fontSize: "30px", margin: 0 }}>{courses.length}</h3>
                  <p style={{ color: "#4caf50", margin: "5px 0" }}>Total Courses</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ ...panel, flex: 2 }}>
                  <h3 style={panelTitle}>📚 My Assigned Courses</h3>
                  {courses.length === 0
                    ? <p style={emptyMsg}>No courses assigned yet.</p>
                    : courses.map(c => (
                      <div key={c.id} style={{ padding: "12px", backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <strong style={{ color: "#042954" }}>{c.course_name}</strong>
                          <span style={{ marginLeft: "10px", fontSize: "12px", color: "#888" }}>{c.course_code}</span>
                        </div>
                        <span style={{ fontSize: "12px", color: "#666" }}>Section: {c.section || "—"} | Credits: {c.credits}</span>
                      </div>
                    ))}
                </div>
                <div style={{ ...panel, flex: 1 }}>
                  <h3 style={panelTitle}>📢 Latest Notices</h3>
                  {notices.slice(0, 3).map((n, i) => (
                    <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ fontWeight: "bold", fontSize: "13px", color: "#042954" }}>{n.title}</div>
                      <small style={{ color: "#888" }}>{new Date(n.created_at).toLocaleDateString()}</small>
                    </div>
                  ))}
                  {notices.length === 0 && <p style={emptyMsg}>No notices.</p>}
                </div>
              </div>
            </>
          )}

          {/* STUDENTS */}
          {activeTab === "students" && (
            <div style={panel}>
              <h3 style={panelTitle}>👥 Enrolled Students</h3>
              <CourseSelector />
              {students.length === 0 ? (
                <p style={emptyMsg}>No students enrolled in this course yet.</p>
              ) : (
                // Group by section
                Object.entries(
                  students.reduce((acc, s) => {
                    const sec = s.section || "No Section";
                    if (!acc[sec]) acc[sec] = [];
                    acc[sec].push(s);
                    return acc;
                  }, {})
                ).map(([section, sectionStudents]) => (
                  <div key={section} style={{ marginBottom: "25px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <span style={{ backgroundColor: "#673ab7", color: "white", padding: "4px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: "bold" }}>
                        Section {section}
                      </span>
                      <span style={{ fontSize: "13px", color: "#888" }}>{sectionStudents.length} student(s)</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                      {sectionStudents.map(s => (
                        <div key={s.id} style={{ padding: "15px", backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "8px", borderLeft: "4px solid #673ab7" }}>
                          <div style={{ fontWeight: "bold", color: "#042954", fontSize: "14px" }}>{s.full_name}</div>
                          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Roll: {s.roll_number}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MY COURSES */}
          {activeTab === "courses" && (
            <div style={panel}>
              <h3 style={panelTitle}>📚 My Courses</h3>
              {courses.length === 0
                ? <p style={emptyMsg}>No courses assigned yet.</p>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "15px" }}>
                    {courses.map(c => (
                      <div key={c.id} style={{ padding: "20px", backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "8px", borderTop: "4px solid #673ab7" }}>
                        <h4 style={{ margin: "0 0 8px", color: "#042954" }}>{c.course_name}</h4>
                        <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Code: {c.course_code}</p>
                        <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Credits: {c.credits}</p>
                        <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Section: {c.section || "—"}</p>
                      </div>
                    ))}
                  </div>}
            </div>
          )}

          {/* ASSIGNMENTS */}
          {activeTab === "assignments" && (
            <div style={panel}>
              <h3 style={panelTitle}>📝 Assignments</h3>
              <CourseSelector />
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input style={inputStyle} placeholder="Assignment Title *" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} />
                <input style={inputStyle} placeholder="Description" value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} />
                <input style={inputStyle} type="date" value={newAssignment.due_date} onChange={e => setNewAssignment({...newAssignment, due_date: e.target.value})} />
                <button style={addBtn} onClick={handleAddAssignment}>+ Create</button>
              </div>
              {assignments.length === 0
                ? <p style={emptyMsg}>No assignments for this course yet.</p>
                : <table style={tableStyle}>
                    <thead><tr style={theadRow}>
                      <th style={th}>Title</th><th style={th}>Description</th>
                      <th style={th}>Due Date</th><th style={th}>Submissions</th>
                    </tr></thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id}>
                          <td style={td}>{a.title}</td>
                          <td style={td}>{a.description || "—"}</td>
                          <td style={td}>{a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}</td>
                          <td style={td}>{a.submission_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>
          )}

          {/* GRADES */}
          {activeTab === "grades" && (
            <div style={panel}>
              <h3 style={panelTitle}>💯 Upload Grades</h3>
              <CourseSelector />
              {students.length === 0
                ? <p style={emptyMsg}>No students found for this course.</p>
                : <table style={tableStyle}>
                    <thead><tr style={theadRow}>
                      <th style={th}>Name</th><th style={th}>Roll No</th>
                      <th style={th}>Grade</th><th style={th}>Marks</th>
                      <th style={th}>Remarks</th><th style={th}>Action</th>
                    </tr></thead>
                    <tbody>
                      {students.map(s => {
                        const existing = gradeList.find(g => g.roll_number === s.roll_number);
                        return (
                          <tr key={s.id}>
                            <td style={td}>{s.full_name}</td>
                            <td style={td}>{s.roll_number}</td>
                            <td style={td}>
                              <input style={smallInput} placeholder={existing?.grade || "A"} defaultValue={existing?.grade || ""}
                                onChange={e => handleGradeChange(s.id, "grade", e.target.value)} />
                            </td>
                            <td style={td}>
                              <input style={smallInput} placeholder={existing?.marks || "0"} defaultValue={existing?.marks || ""}
                                onChange={e => handleGradeChange(s.id, "marks", e.target.value)} />
                            </td>
                            <td style={td}>
                              <input style={smallInput} placeholder={existing?.remarks || "Remarks"} defaultValue={existing?.remarks || ""}
                                onChange={e => handleGradeChange(s.id, "remarks", e.target.value)} />
                            </td>
                            <td style={td}>
                              <button onClick={() => handleSaveGrade(s.id)} style={saveBtn}>Save</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>}
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === "attendance" && (
            <div style={panel}>
              <h3 style={panelTitle}>📅 Mark Attendance</h3>
              <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#666", marginRight: "8px" }}>Course:</label>
                  <select style={selectStyle} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#666", marginRight: "8px" }}>Date:</label>
                  <input type="date" style={selectStyle} value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                </div>
                <button style={addBtn} onClick={handleSaveAttendance}>Save Attendance</button>
              </div>

              {students.length === 0
                ? <p style={emptyMsg}>No students found for this course.</p>
                : <>
                    <table style={tableStyle}>
                      <thead><tr style={theadRow}>
                        <th style={th}>#</th><th style={th}>Name</th><th style={th}>Roll No</th><th style={th}>Status</th>
                      </tr></thead>
                      <tbody>
                        {students.map((s, i) => {
                          const rec = attendanceRecords.find(r => r.student_id === s.id);
                          return (
                            <tr key={s.id}>
                              <td style={td}>{i + 1}</td>
                              <td style={td}>{s.full_name}</td>
                              <td style={td}>{s.roll_number}</td>
                              <td style={td}>
                                {["present", "absent", "late"].map(status => (
                                  <label key={status} style={{ marginRight: "12px", fontSize: "13px", cursor: "pointer" }}>
                                    <input type="radio" name={`att-${s.id}`} value={status}
                                      checked={rec?.status === status}
                                      onChange={() => handleAttendanceChange(s.id, status)}
                                      style={{ marginRight: "4px" }} />
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </label>
                                ))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {attendanceSummary.length > 0 && (
                      <>
                        <h4 style={{ marginTop: "30px", color: "#042954" }}>Overall Attendance Summary</h4>
                        <table style={tableStyle}>
                          <thead><tr style={theadRow}>
                            <th style={th}>Name</th><th style={th}>Roll No</th>
                            <th style={th}>Total</th><th style={th}>Present</th><th style={th}>%</th>
                          </tr></thead>
                          <tbody>
                            {attendanceSummary.map((a, i) => (
                              <tr key={i}>
                                <td style={td}>{a.full_name}</td>
                                <td style={td}>{a.roll_number}</td>
                                <td style={td}>{a.total}</td>
                                <td style={td}>{a.present}</td>
                                <td style={{ ...td, fontWeight: "bold", color: a.percentage >= 75 ? "#2e7d32" : "#c62828" }}>
                                  {a.percentage}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                  </>}
            </div>
          )}

          {/* NOTICES */}
          {activeTab === "notices" && (
            <div style={panel}>
              <h3 style={panelTitle}>📢 University Notices</h3>
              {notices.length === 0
                ? <p style={emptyMsg}>No notices posted yet.</p>
                : notices.map((n, i) => (
                  <div key={i} style={{ padding: "15px", backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "8px", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "bold", color: "#042954", fontSize: "15px" }}>{n.title}</div>
                    <p style={{ fontSize: "13px", color: "#444", margin: "8px 0" }}>{n.content}</p>
                    <small style={{ color: "#888" }}>{new Date(n.created_at).toLocaleDateString()}</small>
                  </div>
                ))}
            </div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <ProfileTab user={user} role="Teacher" fields={[
              ["Full Name", user.full_name],
              ["Username", user.username],
              ["Email", user.email || "—"],
              ["Contact", user.contact_no || "—"],
              ["Role", "Teacher"],
            ]} />
          )}

        </div>
      </div>
    </div>
  );
}

// Styles
const panel      = { backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "20px" };
const panelTitle = { marginTop: 0, fontSize: "18px", color: "#042954", borderBottom: "2px solid #f0f1f3", paddingBottom: "12px" };
const statCard   = { flex: 1, padding: "20px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", textAlign: "center" };
const liveBtn    = { padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" };
const addBtn     = { padding: "10px 20px", backgroundColor: "#042954", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap" };
const saveBtn    = { padding: "5px 12px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const inputStyle = { flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #ddd", minWidth: "120px" };
const smallInput = { padding: "6px 8px", borderRadius: "4px", border: "1px solid #ddd", width: "80px" };
const selectStyle = { padding: "8px 12px", borderRadius: "4px", border: "1px solid #ddd", fontSize: "13px" };
const emptyMsg   = { textAlign: "center", color: "#999", marginTop: "20px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const theadRow   = { textAlign: "left", borderBottom: "2px solid #eee", backgroundColor: "#f9f9f9" };
const th         = { padding: "10px 12px", color: "#666", fontSize: "13px" };
const td         = { padding: "10px 12px", fontSize: "14px", borderBottom: "1px solid #f5f5f5" };

export default TeacherDashboard;
