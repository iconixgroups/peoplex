import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>People X</h1>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active">
            <i className="fas fa-home"></i>
            Dashboard
          </Link>
          <Link to="/employees" className="nav-item">
            <i className="fas fa-users"></i>
            Employees
          </Link>
          <Link to="/attendance" className="nav-item">
            <i className="fas fa-calendar-check"></i>
            Attendance
          </Link>
          <Link to="/leave" className="nav-item">
            <i className="fas fa-calendar-minus"></i>
            Leave
          </Link>
          <Link to="/recruitment" className="nav-item">
            <i className="fas fa-user-plus"></i>
            Recruitment
          </Link>
          <Link to="/performance" className="nav-item">
            <i className="fas fa-chart-line"></i>
            Performance
          </Link>
          <Link to="/payroll" className="nav-item">
            <i className="fas fa-money-bill-wave"></i>
            Payroll
          </Link>
          <Link to="/settings" className="nav-item">
            <i className="fas fa-cog"></i>
            Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="main-header">
          <div className="header-search">
            <input type="search" placeholder="Search..." />
          </div>
          <div className="header-profile">
            <img src="https://via.placeholder.com/40" alt="Profile" className="profile-image" />
            <span className="profile-name">John Doe</span>
          </div>
        </header>
        <div className="dashboard-content">
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Total Employees</h3>
              <p className="card-number">156</p>
              <p className="card-trend positive">+12% from last month</p>
            </div>
            <div className="dashboard-card">
              <h3>Present Today</h3>
              <p className="card-number">142</p>
              <p className="card-trend">91% attendance rate</p>
            </div>
            <div className="dashboard-card">
              <h3>On Leave</h3>
              <p className="card-number">8</p>
              <p className="card-trend">5% of workforce</p>
            </div>
            <div className="dashboard-card">
              <h3>Open Positions</h3>
              <p className="card-number">12</p>
              <p className="card-trend negative">4 urgent hires</p>
            </div>
          </div>
          <div className="dashboard-charts">
            {/* Charts will be implemented later */}
            <div className="chart-placeholder">
              <h3>Employee Distribution</h3>
              <div className="placeholder-content">Chart coming soon</div>
            </div>
            <div className="chart-placeholder">
              <h3>Attendance Trends</h3>
              <div className="placeholder-content">Chart coming soon</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 