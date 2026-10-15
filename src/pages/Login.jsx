import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [mode, setMode]           = useState("login"); // "login" | "register"
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const [departments, setDepartments] = useState([]);
  // Registration fields
  const [reg, setReg] = useState({
    full_name: "", username: "", password: "", confirm_password: "",
    roll_number: "", section: "", email: "", contact_no: "", department_id: "",
    gender: "", year_of_study: "1", semester: "1"
  });

  useEffect(() => {
    axios.get("http://localhost:5000/departments").then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const navigate = useNavigate();

  // --- LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const res = await axios.post("http://localhost:5000/login", { username, password });
      if (res.data.success) {
        const user = res.data.user;
        localStorage.setItem("user", JSON.stringify(user));
        if (user.role === "admin")        navigate("/admin");
        else if (user.role === "teacher") navigate("/teacher");
        else                              navigate("/student");
      } else {
        setError(res.data.message || "Invalid credentials");
      }
    } catch {
      setError("Server error. Make sure the backend is running.");
    }
  };

  // --- REGISTER ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    // Check if registration is allowed
    try {
      const check = await axios.get("http://localhost:5000/settings/allow_registration");
      if (!check.data.enabled) return setError("Student registration is currently closed by the administrator.");
    } catch { /* allow if check fails */ }
    if (!reg.full_name || !reg.username || !reg.password || !reg.roll_number)
      return setError("Full name, username, roll number and password are required.");
    if (reg.password !== reg.confirm_password)
      return setError("Passwords do not match.");
    try {
      const res = await axios.post("http://localhost:5000/student/register", {
        full_name:     reg.full_name,
        username:      reg.username,
        password:      reg.password,
        roll_number:   reg.roll_number,
        section:       reg.section,
        email:         reg.email,
        contact_no:    reg.contact_no,
        department_id: reg.department_id || null,
        gender:        reg.gender || null,
        year_of_study: reg.year_of_study || 1,
        semester:      reg.semester || 1,
      });
      const sid = res.data.student_id_no;
      setSuccess(`Account created! Your Student ID is: ${sid} — save it. You can now log in.`);
      setReg({ full_name: "", username: "", password: "", confirm_password: "", roll_number: "", section: "", email: "", contact_no: "", department_id: "", gender: "", year_of_study: "1", semester: "1" });
      setMode("login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial", backgroundColor: "#f4f7f6" }}>
      <div style={{ width: "380px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", overflow: "hidden" }}>

        {/* Campus Logo */}
        <div style={{ backgroundColor: "#f4f7f6", padding: "20px 0 0", display: "flex", justifyContent: "center" }}>
          <img
            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj4KICA8IS0tIEJhc2UgY2lyY2xlIC0tPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjU4IiBmaWxsPSIjMDQyOTU0IiBzdHJva2U9IiNmZmMxMDciIHN0cm9rZS13aWR0aD0iMyIvPgogIDwhLS0gQ29sdW1ucyAvIGJ1aWxkaW5nIC0tPgogIDxyZWN0IHg9IjI4IiB5PSI3MCIgd2lkdGg9IjgiIGhlaWdodD0iMjYiIGZpbGw9IndoaXRlIi8+CiAgPHJlY3QgeD0iNDIiIHk9IjYyIiB3aWR0aD0iOCIgaGVpZ2h0PSIzNCIgZmlsbD0id2hpdGUiLz4KICA8cmVjdCB4PSI1NiIgeT0iNTYiIHdpZHRoPSI4IiBoZWlnaHQ9IjQwIiBmaWxsPSJ3aGl0ZSIvPgogIDxyZWN0IHg9IjcwIiB5PSI2MiIgd2lkdGg9IjgiIGhlaWdodD0iMzQiIGZpbGw9IndoaXRlIi8+CiAgPHJlY3QgeD0iODQiIHk9IjcwIiB3aWR0aD0iOCIgaGVpZ2h0PSIyNiIgZmlsbD0id2hpdGUiLz4KICA8IS0tIFJvb2YgdHJpYW5nbGUgLS0+CiAgPHBvbHlnb24gcG9pbnRzPSI2MCwyMiAyMiw1NiA5OCw1NiIgZmlsbD0iI2ZmYzEwNyIvPgogIDwhLS0gQmFzZSBsaW5lIC0tPgogIDxyZWN0IHg9IjIwIiB5PSI5NiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjUiIGZpbGw9IiNmZmMxMDciIHJ4PSIyIi8+CiAgPCEtLSBUb3Agc3RhciAvIHRvcmNoIC0tPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iMTgiIHI9IjUiIGZpbGw9IiNmZmMxMDciLz4KPC9zdmc+"
            alt="UniFlow Campus Logo"
            style={{ width: "80px", height: "80px" }}
          />
        </div>

        {/* Header */}
        <div style={{ backgroundColor: "#042954", padding: "18px 25px 22px", textAlign: "center" }}>
          <h2 style={{ color: "white", margin: 0 }}>UniFlow 🏛️</h2>
          <p style={{ color: "#ffc107", margin: "5px 0 0", fontSize: "13px" }}>University Management System</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", borderBottom: "2px solid #f0f0f0" }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
              style={{ flex: 1, padding: "14px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "bold",
                backgroundColor: mode === m ? "#042954" : "white",
                color: mode === m ? "#ffc107" : "#666",
                borderBottom: mode === m ? "3px solid #ffc107" : "none" }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div style={{ padding: "25px" }}>
          {error   && <p style={{ color: "#e53935", backgroundColor: "#fdecea", padding: "10px", borderRadius: "6px", fontSize: "13px", margin: "0 0 15px" }}>{error}</p>}
          {success && <p style={{ color: "#2e7d32", backgroundColor: "#e8f5e9", padding: "10px", borderRadius: "6px", fontSize: "13px", margin: "0 0 15px" }}>{success}</p>}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <label style={labelStyle}>Username</label>
              <input style={inputStyle} type="text" placeholder="Enter your username"
                value={username} onChange={e => setUsername(e.target.value)} />

              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)} />

              <button type="submit" style={primaryBtn}>Sign In</button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#888", marginTop: "15px" }}>
                No account?{" "}
                <span onClick={() => setMode("register")} style={{ color: "#042954", cursor: "pointer", fontWeight: "bold" }}>
                  Register here
                </span>
              </p>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === "register" && (
            <form onSubmit={handleRegister}>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} placeholder="Your full name"
                value={reg.full_name} onChange={e => setReg({...reg, full_name: e.target.value})} />

              <label style={labelStyle}>Username *</label>
              <input style={inputStyle} placeholder="Choose a username"
                value={reg.username} onChange={e => setReg({...reg, username: e.target.value})} />

              <label style={labelStyle}>Roll Number *</label>
              <input style={inputStyle} placeholder="e.g. CS-2024-001"
                value={reg.roll_number} onChange={e => setReg({...reg, roll_number: e.target.value})} />

              <label style={labelStyle}>Section</label>
              <input style={inputStyle} placeholder="e.g. A"
                value={reg.section} onChange={e => setReg({...reg, section: e.target.value})} />

              <label style={labelStyle}>Department</label>
              <select style={inputStyle} value={reg.department_id} onChange={e => setReg({...reg, department_id: e.target.value})}>
                <option value="">Select your department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <label style={labelStyle}>Gender *</label>
              <select style={inputStyle} value={reg.gender} onChange={e => setReg({...reg, gender: e.target.value})}>
                <option value="">Select gender</option>
                <option value="Male">Male (M)</option>
                <option value="Female">Female (F)</option>
              </select>

              <label style={labelStyle}>Year of Study *</label>
              <select style={inputStyle} value={reg.year_of_study} onChange={e => setReg({...reg, year_of_study: e.target.value})}>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>

              <label style={labelStyle}>Semester *</label>
              <select style={inputStyle} value={reg.semester} onChange={e => setReg({...reg, semester: e.target.value})}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>

              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" placeholder="your@email.com"
                value={reg.email} onChange={e => setReg({...reg, email: e.target.value})} />

              <label style={labelStyle}>Contact No</label>
              <input style={inputStyle} placeholder="Phone number"
                value={reg.contact_no} onChange={e => setReg({...reg, contact_no: e.target.value})} />

              <label style={labelStyle}>Password *</label>
              <input style={inputStyle} type="password" placeholder="Create a password"
                value={reg.password} onChange={e => setReg({...reg, password: e.target.value})} />

              <label style={labelStyle}>Confirm Password *</label>
              <input style={inputStyle} type="password" placeholder="Repeat password"
                value={reg.confirm_password} onChange={e => setReg({...reg, confirm_password: e.target.value})} />

              <button type="submit" style={primaryBtn}>Create Account</button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#888", marginTop: "15px" }}>
                Already have an account?{" "}
                <span onClick={() => setMode("login")} style={{ color: "#042954", cursor: "pointer", fontWeight: "bold" }}>
                  Sign in
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle  = { display: "block", fontSize: "12px", fontWeight: "bold", color: "#555", marginBottom: "5px", textTransform: "uppercase" };
const inputStyle  = { display: "block", width: "100%", padding: "10px", marginBottom: "14px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" };
const primaryBtn  = { width: "100%", padding: "12px", backgroundColor: "#042954", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: "bold" };

export default Login;
