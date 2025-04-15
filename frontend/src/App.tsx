import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import Employees from './components/Employees/Employees';
import Attendance from './components/Attendance/Attendance';
import Leave from './components/Leave/Leave';
import Login from './components/Login/Login';
import LoginTest from './components/Login/LoginTest';
import './App.css';

// Placeholder components
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
          <Route path="/login-test" element={<LoginTest />} />
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
