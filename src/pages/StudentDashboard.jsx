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
    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
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

function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem("user")) || { full_name: "Student", roll_number: "#0000" };
  const [activeTab, setActiveTab] = useState("dashboard");

  const [notices, setNotices]               = useState([]);
  const [performance, setPerformance]       = useState([]);
  const [attendance, setAttendance]         = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [assignments, setAssignments]       = useState([]);
  const [financial, setFinancial]           = useState([]);

  // Report state
  const [report, setReport] = useState({ category: "Class Issue", subject: "", message: "" });
  const [reportSent, setReportSent] = useState(false);

  // Receipt modal state
  const [receiptModal, setReceiptModal] = useState(null); // holds the financial record being paid
  const [receiptImage, setReceiptImage] = useState(null);
  const [paymentMessages, setPaymentMessages] = useState([]); // confirmed paid messages from admin

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());

  const fetchNotices          = () => axios.get("http://localhost:5000/notices?audience=student").then(r => setNotices(r.data)).catch(() => {});
  const fetchPerformance      = () => axios.get(`http://localhost:5000/student/performance/${user.id}`).then(r => setPerformance(r.data)).catch(() => {});
  const fetchAttendance       = () => axios.get(`http://localhost:5000/student/attendance/${user.id}`).then(r => setAttendance(r.data)).catch(() => {});
  const fetchEnrolledCourses  = () => axios.get(`http://localhost:5000/student/enrolled-courses/${user.id}`).then(r => setEnrolledCourses(r.data)).catch(() => {});
  const fetchAvailableCourses = () => axios.get(`http://localhost:5000/student/available-courses/${user.id}`).then(r => setAvailableCourses(r.data)).catch(() => {});
  const fetchAssignments      = () => axios.get(`http://localhost:5000/student/assignments/${user.id}`).then(r => setAssignments(r.data)).catch(() => {});
  const fetchFinancial = () => axios.get(`http://localhost:5000/student/financial/${user.id}`).then(r => {
    setFinancial(r.data);
    setPaymentMessages(r.data.filter(f => f.status === 'paid' && f.payment_message));
  }).catch(() => {});

  useEffect(() => {
    fetchNotices();
    if (activeTab === "dashboard")    { fetchPerformance(); fetchAttendance(); fetchEnrolledCourses(); fetchFinancial(); }
    if (activeTab === "courses")      { fetchEnrolledCourses(); fetchAvailableCourses(); }
    if (activeTab === "assignments")  fetchAssignments();
    if (activeTab === "grades")       fetchPerformance();
    if (activeTab === "attendance")   fetchAttendance();
    if (activeTab === "financial")    fetchFinancial();
  }, [activeTab]);

  const handleSubmitAssignment = async (assignment_id) => {
    const check = await axios.get("http://localhost:5000/settings/allow_assignment_submit").catch(() => ({ data: { enabled: true } }));
    if (!check.data.enabled) return alert("Assignment submission is currently closed by the administrator.");
    await axios.post("http://localhost:5000/student/submit-assignment", { assignment_id, student_id: user.id });
    fetchAssignments();
  };

  const handleEnroll = async (course_id) => {
    const check = await axios.get("http://localhost:5000/settings/allow_course_enrollment").catch(() => ({ data: { enabled: true } }));
    if (!check.data.enabled) return alert("Course enrollment is currently closed by the administrator.");
    await axios.post("http://localhost:5000/student/enroll", { student_id: user.id, course_id });
    fetchEnrolledCourses(); fetchAvailableCourses();
  };

  const handleUnenroll = async (course_id) => {
    const check = await axios.get("http://localhost:5000/settings/allow_course_enrollment").catch(() => ({ data: { enabled: true } }));
    if (!check.data.enabled) return alert("Course enrollment changes are currently closed by the administrator.");
    if (!window.confirm("Drop this course?")) return;
    await axios.delete("http://localhost:5000/student/unenroll", { data: { student_id: user.id, course_id } });
    fetchEnrolledCourses(); fetchAvailableCourses();
  };

  // Overall attendance % across all courses
  const overallAttendance = attendance.length > 0
    ? Math.round(attendance.reduce((sum, a) => sum + parseFloat(a.percentage || 0), 0) / attendance.length)
    : 0;

  const handleReceiptSubmit = async () => {
    if (!receiptImage) return alert("Please upload a receipt image first.");
    await axios.put(`http://localhost:5000/student/financial/${receiptModal.id}/receipt`, { receipt_image: receiptImage });
    setReceiptModal(null); setReceiptImage(null);
    fetchFinancial();
    alert("Receipt submitted! Awaiting admin confirmation.");
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!report.subject.trim() || !report.message.trim()) return alert("Subject and message are required.");
    try {
      await axios.post("http://localhost:5000/student/report", {
        student_id: user.id,
        student_name: user.full_name,
        roll_number: user.roll_number,
        category: report.category,
        subject: report.subject,
        message: report.message,
      });
      setReport({ category: "Class Issue", subject: "", message: "" });
      setReportSent(true);
      setTimeout(() => setReportSent(false), 4000);
    } catch { alert("Failed to send report. Please try again."); }
  };

  const sidebarItems = [
    { key: "dashboard",   icon: "📊", label: "Dashboard" },
    { key: "courses",     icon: "📚", label: "My Courses" },
    { key: "assignments", icon: "📝", label: "Assignments" },
    { key: "grades",      icon: "💯", label: "My Grades" },
    { key: "attendance",  icon: "📅", label: "Attendance" },
    { key: "notices",     icon: "📢", label: "Notice Board" },
    { key: "financial",   icon: "💰", label: "My Fees" },
    { key: "report",      icon: "�", label: "Report Issue" },
    { key: "profile",     icon: "👤", label: "Profile" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial", backgroundColor: "#f0f1f3" }}>

      {/* SIDEBAR */}
      <div style={{ width: "240px", backgroundColor: "#042954", color: "white", flexShrink: 0 }}>
        <div style={{ padding: "20px", backgroundColor: "#ffc107", color: "#042954", fontWeight: "bold", textAlign: "center", fontSize: "20px" }}>
          UniFlow <span style={{ fontSize: "12px" }}>STUDENT</span>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 30px", backgroundColor: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.08)" }}>
          <div>
            <h2 style={{ margin: 0, color: "#042954" }}>Welcome, {user.full_name}!</h2>
            <p style={{ margin: 0, color: "#888", fontSize: "13px" }}>Roll No: {user.roll_number} | Section: {user.section || "—"}</p>
          </div>
          {/* University Calendar */}
          <div style={{ position: "relative" }}>
            <button style={portalBtn} onClick={() => setShowCalendar(v => !v)}>
              📅 University Calendar
            </button>
            {showCalendar && (() => {
              const year  = calMonth.getFullYear();
              const month = calMonth.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const today = new Date();
              const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const cells = [];
              for (let i = 0; i < firstDay; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) cells.push(d);
              const monthName = calMonth.toLocaleString("default", { month: "long", year: "numeric" });
              return (
                <div style={{ position: "absolute", right: 0, top: "44px", zIndex: 999, backgroundColor: "white", borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", padding: "16px", width: "280px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#042954" }}>‹</button>
                    <span style={{ fontWeight: "bold", color: "#042954", fontSize: "14px" }}>{monthName}</span>
                    <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#042954" }}>›</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", textAlign: "center" }}>
                    {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                      <div key={d} style={{ fontSize: "11px", fontWeight: "bold", color: "#888", padding: "4px 0" }}>{d}</div>
                    ))}
                    {cells.map((d, i) => (
                      <div key={i} style={{
                        padding: "6px 0", fontSize: "13px", borderRadius: "50%",
                        backgroundColor: d && isToday(d) ? "#042954" : "transparent",
                        color: d && isToday(d) ? "white" : d ? "#333" : "transparent",
                        fontWeight: d && isToday(d) ? "bold" : "normal",
                        cursor: d ? "default" : "default"
                      }}>{d || ""}</div>
                    ))}
                  </div>
                  <div style={{ marginTop: "12px", borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#042954", marginBottom: "6px" }}>Academic Events</div>
                    {[
                      { label: "Mid-Term Exams",    date: "Week 8"  },
                      { label: "Final Exams",        date: "Week 16" },
                      { label: "Result Declaration", date: "Week 18" },
                      { label: "Semester Break",     date: "Week 19" },
                    ].map(ev => (
                      <div key={ev.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555", padding: "3px 0" }}>
                        <span>📌 {ev.label}</span>
                        <span style={{ color: "#888" }}>{ev.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div style={{ padding: "30px" }}>

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
                <div style={{ ...metricCard, borderLeft: "6px solid #4caf50" }}>
                  <p style={cardLabel}>Overall Attendance</p>
                  <h3 style={cardValue}>{overallAttendance}%</h3>
                  <span style={{ color: overallAttendance >= 75 ? "#4caf50" : "#e53935", fontSize: "12px" }}>
                    {overallAttendance >= 75 ? "Good Standing" : "Below Minimum"}
                  </span>
                </div>
                <div style={{ ...metricCard, borderLeft: "6px solid #2196f3" }}>
                  <p style={cardLabel}>Courses Enrolled</p>
                  <h3 style={cardValue}>{enrolledCourses.length}</h3>
                  <span style={{ color: "#2196f3", fontSize: "12px" }}>Current Semester</span>
                </div>
                <div style={{ ...metricCard, borderLeft: "6px solid #ff9800" }}>
                  <p style={cardLabel}>Grades Recorded</p>
                  <h3 style={cardValue}>{performance.length}</h3>
                  <span style={{ color: "#ff9800", fontSize: "12px" }}>Subjects graded</span>
                </div>
                <div style={{ ...metricCard, borderLeft: "6px solid #9c27b0" }}>
                  <p style={cardLabel}>Pending Fees</p>
                  <h3 style={cardValue}>{financial.filter(f => f.status === "pending").length}</h3>
                  <span style={{ color: "#9c27b0", fontSize: "12px" }}>Unpaid invoices</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "25px" }}>
                <div style={{ ...panel, flex: 1.5 }}>
                  <h3 style={panelTitle}>📢 Latest Notices</h3>
                  {notices.length === 0
                    ? <p style={emptyMsg}>No announcements yet.</p>
                    : notices.slice(0, 3).map((n, i) => (
                      <div key={i} style={noticeCard}>
                        <div style={{ fontWeight: "bold", color: "#042954" }}>{n.title}</div>
                        <p style={{ fontSize: "13px", color: "#444", margin: "5px 0" }}>{n.content}</p>
                        <small style={{ color: "#888" }}>{new Date(n.created_at).toLocaleDateString()}</small>
                      </div>
                    ))}
                </div>
                <div style={{ ...panel, flex: 1 }}>
                  <h3 style={panelTitle}>📝 Recent Grades</h3>
                  {performance.length === 0
                    ? <p style={emptyMsg}>No grades yet.</p>
                    : performance.slice(0, 5).map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                        <span style={{ fontSize: "14px" }}>{p.course_name}</span>
                        <span style={{ fontWeight: "bold", color: "#042954" }}>{p.grade}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* MY COURSES */}
          {activeTab === "courses" && (
            <>
              {/* Enrolled Courses */}
              <div style={panel}>
                <h3 style={panelTitle}>✅ Enrolled Courses ({enrolledCourses.length})</h3>
                {enrolledCourses.length === 0
                  ? <p style={emptyMsg}>You haven't enrolled in any courses yet. Browse available courses below.</p>
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "15px" }}>
                      {enrolledCourses.map(c => (
                        <div key={c.id} style={{ padding: "20px", backgroundColor: "#f0fff4", border: "1px solid #a5d6a7", borderRadius: "8px", borderTop: "4px solid #4caf50" }}>
                          <h4 style={{ margin: "0 0 8px", color: "#042954" }}>{c.course_name}</h4>
                          <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Code: {c.course_code}</p>
                          <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Credits: {c.credits}</p>
                          <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Teacher: {c.teacher_name || "TBA"}</p>
                          <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Section: {c.section || "—"}</p>
                          <button onClick={() => handleUnenroll(c.id)}
                            style={{ marginTop: "10px", padding: "6px 14px", backgroundColor: "#e53935", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                            Drop Course
                          </button>
                        </div>
                      ))}
                    </div>}
              </div>

              {/* Available Courses */}
              <div style={panel}>
                <h3 style={panelTitle}>📚 Available Courses</h3>
                {availableCourses.length === 0
                  ? <p style={emptyMsg}>No more courses available to enroll in.</p>
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "15px" }}>
                      {availableCourses.map(c => (
                        <div key={c.id} style={{ padding: "20px", backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "8px", borderTop: "4px solid #042954" }}>
                          <h4 style={{ margin: "0 0 8px", color: "#042954" }}>{c.course_name}</h4>
                          <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Code: {c.course_code}</p>
                          <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Credits: {c.credits}</p>
                          <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Teacher: {c.teacher_name || "TBA"}</p>
                          <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>Section: {c.section || "—"}</p>
                          <button onClick={() => handleEnroll(c.id)}
                            style={{ marginTop: "10px", padding: "6px 14px", backgroundColor: "#042954", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                            Enroll
                          </button>
                        </div>
                      ))}
                    </div>}
              </div>
            </>
          )}

          {/* ASSIGNMENTS */}
          {activeTab === "assignments" && (
            <div style={panel}>
              <h3 style={panelTitle}>📝 Assignments</h3>
              {assignments.length === 0
                ? <p style={emptyMsg}>No assignments posted yet.</p>
                : <table style={tableStyle}>
                    <thead><tr style={theadRow}>
                      <th style={th}>Title</th><th style={th}>Course</th>
                      <th style={th}>Due Date</th><th style={th}>Status</th><th style={th}>Action</th>
                    </tr></thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id}>
                          <td style={td}>{a.title}</td>
                          <td style={td}>{a.course_name}</td>
                          <td style={td}>{a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"}</td>
                          <td style={td}>
                            <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "12px",
                              backgroundColor: a.submitted ? "#e8f5e9" : "#fff8e1",
                              color: a.submitted ? "#2e7d32" : "#f57f17" }}>
                              {a.submitted ? "Submitted" : "Pending"}
                            </span>
                          </td>
                          <td style={td}>
                            {!a.submitted && (
                              <button onClick={() => handleSubmitAssignment(a.id)} style={submitBtn}>Submit</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>
          )}

          {/* MY GRADES */}
          {activeTab === "grades" && (
            <div style={panel}>
              <h3 style={panelTitle}>💯 My Grades</h3>
              {performance.length === 0
                ? <p style={emptyMsg}>No grades recorded yet.</p>
                : <table style={tableStyle}>
                    <thead><tr style={theadRow}>
                      <th style={th}>Course</th><th style={th}>Code</th>
                      <th style={th}>Grade</th><th style={th}>Marks</th><th style={th}>Remarks</th>
                    </tr></thead>
                    <tbody>
                      {performance.map((p, i) => (
                        <tr key={i}>
                          <td style={td}>{p.course_name}</td>
                          <td style={td}>{p.course_code}</td>
                          <td style={{ ...td, fontWeight: "bold", color: "#042954" }}>{p.grade || "—"}</td>
                          <td style={td}>{p.marks || "—"}</td>
                          <td style={td}>{p.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === "attendance" && (
            <div style={panel}>
              <h3 style={panelTitle}>📅 My Attendance</h3>
              {attendance.length === 0
                ? <p style={emptyMsg}>No attendance records yet.</p>
                : <>
                    <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                      <div style={{ ...metricCard, borderLeft: "6px solid #4caf50", flex: "none", width: "180px" }}>
                        <p style={cardLabel}>Overall</p>
                        <h3 style={cardValue}>{overallAttendance}%</h3>
                      </div>
                    </div>
                    <table style={tableStyle}>
                      <thead><tr style={theadRow}>
                        <th style={th}>Course</th><th style={th}>Total Classes</th>
                        <th style={th}>Present</th><th style={th}>Percentage</th><th style={th}>Status</th>
                      </tr></thead>
                      <tbody>
                        {attendance.map((a, i) => (
                          <tr key={i}>
                            <td style={td}>{a.course_name}</td>
                            <td style={td}>{a.total}</td>
                            <td style={td}>{a.present}</td>
                            <td style={{ ...td, fontWeight: "bold" }}>{a.percentage}%</td>
                            <td style={td}>
                              <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "12px",
                                backgroundColor: a.percentage >= 75 ? "#e8f5e9" : "#fdecea",
                                color: a.percentage >= 75 ? "#2e7d32" : "#c62828" }}>
                                {a.percentage >= 75 ? "Good" : "Low"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>}
            </div>
          )}

          {/* NOTICE BOARD */}
          {activeTab === "notices" && (
            <div style={panel}>
              <h3 style={panelTitle}>📢 University Notice Board</h3>
              {notices.length === 0
                ? <p style={emptyMsg}>No announcements today.</p>
                : notices.map((n, i) => (
                  <div key={i} style={noticeCard}>
                    <div style={{ fontWeight: "bold", color: "#042954", fontSize: "15px" }}>{n.title}</div>
                    <p style={{ fontSize: "13px", color: "#444", margin: "8px 0" }}>{n.content}</p>
                    <small style={{ color: "#888" }}>{new Date(n.created_at).toLocaleDateString()}</small>
                  </div>
                ))}
            </div>
          )}

          {/* MY FEES */}
          {activeTab === "financial" && (
            <div style={panel}>
              <h3 style={panelTitle}>💰 My Fee Records</h3>

              {/* Payment confirmed messages */}
              {paymentMessages.map(f => (
                <div key={f.id} id={`pmsg-${f.id}`} style={{ backgroundColor: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: "8px", padding: "16px 20px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#2e7d32", fontSize: "15px" }}>✅ Payment Confirmed by Admin</div>
                      <div style={{ fontSize: "13px", color: "#444", marginTop: "6px" }}>{f.payment_message}</div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>Amount: <strong>${f.amount}</strong> — {f.description || f.type}</div>
                    </div>
                    <button onClick={() => {
                      const el = document.getElementById(`pmsg-${f.id}`);
                      const w = window.open('', '_blank');
                      w.document.write(`<html><body style="font-family:Arial;padding:30px">
                        <h2 style="color:#042954">UniFlow — Payment Receipt</h2>
                        <p><strong>Student:</strong> ${user.full_name}</p>
                        <p><strong>Roll No:</strong> ${user.roll_number}</p>
                        <p><strong>Amount:</strong> $${f.amount}</p>
                        <p><strong>Description:</strong> ${f.description || f.type}</p>
                        <p><strong>Message:</strong> ${f.payment_message}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p style="color:green;font-weight:bold">STATUS: PAID ✅</p>
                        <script>window.print();window.close();</script>
                      </body></html>`);
                      w.document.close();
                    }} style={{ padding: "8px 16px", backgroundColor: "#042954", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", whiteSpace: "nowrap" }}>
                      🖨 Print Receipt
                    </button>
                  </div>
                </div>
              ))}

              {financial.length === 0
                ? <p style={emptyMsg}>No financial records found.</p>
                : <table style={tableStyle}>
                    <thead><tr style={theadRow}>
                      <th style={th}>Description</th><th style={th}>Amount</th>
                      <th style={th}>Type</th><th style={th}>Due Date</th><th style={th}>Status</th><th style={th}>Action</th>
                    </tr></thead>
                    <tbody>
                      {financial.map(f => (
                        <tr key={f.id}>
                          <td style={td}>{f.description || "—"}</td>
                          <td style={td}>$ {f.amount}</td>
                          <td style={td}>{f.type}</td>
                          <td style={td}>{f.due_date ? new Date(f.due_date).toLocaleDateString() : "—"}</td>
                          <td style={td}>
                            <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "12px",
                              backgroundColor: f.status === "paid" ? "#e8f5e9" : f.status === "overdue" ? "#fdecea" : "#fff8e1",
                              color: f.status === "paid" ? "#2e7d32" : f.status === "overdue" ? "#c62828" : "#f57f17" }}>
                              {f.status}
                            </span>
                          </td>
                          <td style={td}>
                            {f.status !== "paid" && !f.receipt_submitted && (
                              <button onClick={() => { setReceiptModal(f); setReceiptImage(null); }}
                                style={{ padding: "5px 12px", backgroundColor: "#1976d2", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                                Pay / Upload Receipt
                              </button>
                            )}
                            {f.receipt_submitted && f.status !== "paid" && (
                              <span style={{ fontSize: "12px", color: "#f57f17", fontWeight: "bold" }}>⏳ Awaiting Confirmation</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}

              {/* Receipt Upload Modal */}
              {receiptModal && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "28px", width: "420px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
                    <h3 style={{ margin: "0 0 6px", color: "#042954" }}>📎 Upload Payment Receipt</h3>
                    <p style={{ fontSize: "13px", color: "#666", margin: "0 0 18px" }}>
                      Amount due: <strong>${receiptModal.amount}</strong> — {receiptModal.description || receiptModal.type}
                    </p>
                    <div style={{ border: "2px dashed #ccc", borderRadius: "8px", padding: "20px", textAlign: "center", marginBottom: "16px", backgroundColor: "#f8faff" }}>
                      {receiptImage
                        ? <img src={receiptImage} alt="Receipt" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "6px" }} />
                        : <p style={{ color: "#999", margin: 0 }}>No image selected</p>}
                    </div>
                    <label style={{ display: "block", padding: "10px", backgroundColor: "#042954", color: "white", borderRadius: "6px", textAlign: "center", cursor: "pointer", marginBottom: "12px", fontSize: "14px" }}>
                      📷 Choose Receipt Image
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => setReceiptImage(ev.target.result);
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={handleReceiptSubmit} style={{ flex: 1, padding: "11px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
                        ✅ Submit Payment
                      </button>
                      <button onClick={() => setReceiptModal(null)} style={{ flex: 1, padding: "11px", backgroundColor: "#e53935", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REPORT ISSUE */}
          {activeTab === "report" && (
            <div style={panel}>
              <h3 style={panelTitle}>🚨 Report an Issue to Admin</h3>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
                Use this form to report any problem — class issues, teaching concerns, facilities, or anything else. Your message goes directly to the admin.
              </p>
              {reportSent && (
                <div style={{ backgroundColor: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px", color: "#2e7d32", fontWeight: "bold", fontSize: "14px" }}>
                  ✅ Your report has been sent to the admin successfully!
                </div>
              )}
              <form onSubmit={handleSubmitReport}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={formLabel}>Category</label>
                  <select style={formInput} value={report.category} onChange={e => setReport({ ...report, category: e.target.value })}>
                    <option>Class Issue</option>
                    <option>Teaching Method</option>
                    <option>Facilities</option>
                    <option>Grading Concern</option>
                    <option>Attendance Dispute</option>
                    <option>Harassment / Misconduct</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={formLabel}>Subject *</label>
                  <input style={formInput} placeholder="Brief title of your issue" value={report.subject}
                    onChange={e => setReport({ ...report, subject: e.target.value })} />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={formLabel}>Message *</label>
                  <textarea style={{ ...formInput, height: "140px", resize: "vertical" }}
                    placeholder="Describe the issue in detail..."
                    value={report.message}
                    onChange={e => setReport({ ...report, message: e.target.value })} />
                </div>
                <button type="submit" style={{ padding: "11px 28px", backgroundColor: "#042954", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: "bold" }}>
                  Send Report
                </button>
              </form>
            </div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <ProfileTab user={user} role="Student" fields={[
              ["Full Name", user.full_name],
              ["Username", user.username],
              ["Roll Number", user.roll_number],
              ["Section", user.section || "—"],
              ["Email", user.email || "—"],
              ["Contact", user.contact_no || "—"],
            ]} />
          )}

        </div>
      </div>
    </div>
  );
}

// Styles
const panel      = { backgroundColor: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: "20px" };
const panelTitle = { marginTop: 0, fontSize: "18px", color: "#042954", borderBottom: "2px solid #f0f1f3", paddingBottom: "12px" };
const metricCard = { flex: 1, backgroundColor: "white", padding: "15px 20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };
const cardLabel  = { margin: 0, color: "#888", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" };
const cardValue  = { margin: "5px 0", fontSize: "24px", color: "#333" };
const portalBtn  = { padding: "10px 15px", backgroundColor: "white", color: "#042954", border: "1px solid #042954", borderRadius: "5px", cursor: "pointer", fontSize: "13px" };
const noticeCard = { padding: "15px", backgroundColor: "#f8faff", border: "1px solid #e1e8f0", borderRadius: "8px", marginBottom: "12px" };
const emptyMsg   = { textAlign: "center", color: "#999", marginTop: "20px" };
const submitBtn  = { padding: "5px 12px", backgroundColor: "#042954", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const theadRow   = { textAlign: "left", borderBottom: "2px solid #eee", backgroundColor: "#f9f9f9" };
const th         = { padding: "10px 12px", color: "#666", fontSize: "13px" };
const td         = { padding: "10px 12px", fontSize: "14px", borderBottom: "1px solid #f5f5f5" };
const formLabel  = { display: "block", fontSize: "12px", fontWeight: "bold", color: "#555", marginBottom: "6px", textTransform: "uppercase" };
const formInput  = { display: "block", width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box", fontFamily: "Arial" };

export default StudentDashboard;
