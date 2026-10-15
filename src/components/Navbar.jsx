import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '15px 30px', 
      backgroundColor: '#1a237e', 
      color: 'white',
      alignItems: 'center'
    }}>
      <h2 style={{ margin: 0 }}>UniFlow 🏛️</h2>
      <div>
        <Link to="/" style={{ color: 'white', marginRight: '20px', textDecoration: 'none' }}>Home</Link>
        <button 
          onClick={() => navigate("/")}
          style={{ backgroundColor: '#ff1744', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;