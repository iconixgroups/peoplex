import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Leave.css';

interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

const Leave: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await api.get('/leave-requests');
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch leave requests');
      setLoading(false);
      // Mock data for demonstration
      setRequests([
        {
          id: 1,
          employeeId: 1,
          employeeName: 'John Doe',
          type: 'Vacation',
          startDate: '2024-04-15',
          endDate: '2024-04-20',
          status: 'Pending',
          reason: 'Annual family vacation'
        },
        {
          id: 2,
          employeeId: 2,
          employeeName: 'Jane Smith',
          type: 'Sick Leave',
          startDate: '2024-04-10',
          endDate: '2024-04-12',
          status: 'Approved',
          reason: 'Medical appointment'
        },
      ]);
    }
  };

  const handleStatusChange = async (requestId: number, newStatus: 'Approved' | 'Rejected') => {
    try {
      await api.patch(`/leave-requests/${requestId}`, { status: newStatus });
      setRequests(requests.map(request =>
        request.id === requestId ? { ...request, status: newStatus } : request
      ));
    } catch (err) {
      console.error('Failed to update leave request status:', err);
    }
  };

  const filteredRequests = filterStatus === 'all'
    ? requests
    : requests.filter(request => request.status.toLowerCase() === filterStatus);

  return (
    <div className="leave-container">
      <div className="leave-header">
        <h1>Leave Management</h1>
        <div className="header-actions">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="new-request-btn">
            <i className="fas fa-plus"></i>
            New Request
          </button>
        </div>
      </div>

      <div className="leave-stats">
        <div className="stat-card">
          <h3>Total Requests</h3>
          <p className="stat-number">24</p>
          <p className="stat-label">This month</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">8</p>
          <p className="stat-label">Awaiting approval</p>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <p className="stat-number">12</p>
          <p className="stat-label">This month</p>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <p className="stat-number">4</p>
          <p className="stat-label">This month</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading leave requests...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="leave-table-container">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div className="employee-name">
                      <img
                        src={`https://ui-avatars.com/api/?name=${request.employeeName}&background=random`}
                        alt={request.employeeName}
                        className="employee-avatar"
                      />
                      {request.employeeName}
                    </div>
                  </td>
                  <td>{request.type}</td>
                  <td>
                    {new Date(request.startDate).toLocaleDateString()} - 
                    {new Date(request.endDate).toLocaleDateString()}
                  </td>
                  <td>{request.reason}</td>
                  <td>
                    <span className={`status-badge status-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {request.status === 'Pending' && (
                        <>
                          <button
                            className="action-btn approve"
                            onClick={() => handleStatusChange(request.id, 'Approved')}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="action-btn reject"
                            onClick={() => handleStatusChange(request.id, 'Rejected')}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
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

export default Leave; 