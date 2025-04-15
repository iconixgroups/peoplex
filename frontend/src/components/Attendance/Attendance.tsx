import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Attendance.css';

interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
}

const Attendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [selectedDate]);

  const fetchAttendanceRecords = async () => {
    try {
      const response = await api.get(`/attendance?date=${selectedDate}`);
      setRecords(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch attendance records');
      setLoading(false);
      // Mock data for demonstration
      setRecords([
        {
          id: 1,
          employeeId: 1,
          employeeName: 'John Doe',
          date: selectedDate,
          checkIn: '09:00',
          checkOut: '17:00',
          status: 'Present'
        },
        {
          id: 2,
          employeeId: 2,
          employeeName: 'Jane Smith',
          date: selectedDate,
          checkIn: '09:30',
          checkOut: '17:30',
          status: 'Late'
        },
      ]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'status-present';
      case 'Absent':
        return 'status-absent';
      case 'Late':
        return 'status-late';
      case 'Half Day':
        return 'status-half-day';
      default:
        return '';
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1>Attendance</h1>
        <div className="header-actions">
          <div className="date-picker">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button className="generate-report-btn">
            <i className="fas fa-file-export"></i>
            Generate Report
          </button>
        </div>
      </div>

      <div className="attendance-stats">
        <div className="stat-card">
          <h3>Present</h3>
          <p className="stat-number">142</p>
          <p className="stat-percentage">91%</p>
        </div>
        <div className="stat-card">
          <h3>Absent</h3>
          <p className="stat-number">8</p>
          <p className="stat-percentage">5%</p>
        </div>
        <div className="stat-card">
          <h3>Late</h3>
          <p className="stat-number">6</p>
          <p className="stat-percentage">4%</p>
        </div>
        <div className="stat-card">
          <h3>Half Day</h3>
          <p className="stat-number">2</p>
          <p className="stat-percentage">1%</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading attendance records...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="attendance-table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="employee-name">
                      <img
                        src={`https://ui-avatars.com/api/?name=${record.employeeName}&background=random`}
                        alt={record.employeeName}
                        className="employee-avatar"
                      />
                      {record.employeeName}
                    </div>
                  </td>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{record.checkIn}</td>
                  <td>{record.checkOut}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="action-btn view">
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Attendance; 