import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Placeholder components
const Login = () => <div>Login Page</div>;
const Dashboard = () => <div>Dashboard</div>;
const Employees = () => <div>Employees</div>;
const Attendance = () => <div>Attendance</div>;
const Leave = () => <div>Leave Management</div>;
const Recruitment = () => <div>Recruitment</div>;
const Performance = () => <div>Performance</div>;
const Payroll = () => <div>Payroll</div>;
const Settings = () => <div>Settings</div>;

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees/*" element={<Employees />} />
          <Route path="/attendance/*" element={<Attendance />} />
          <Route path="/leave/*" element={<Leave />} />
          <Route path="/recruitment/*" element={<Recruitment />} />
          <Route path="/performance/*" element={<Performance />} />
          <Route path="/payroll/*" element={<Payroll />} />
          <Route path="/settings/*" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
