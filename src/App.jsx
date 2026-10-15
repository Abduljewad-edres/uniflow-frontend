import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // Import the new Navbar
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";

function App() {
  return (
    <div className="app-container">
      <Navbar /> {/* This stays at the top of every page! */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        
        
      </Routes>
    </div>
  );
}

export default App;