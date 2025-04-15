import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Employees.css';

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  status: string;
  joinDate: string;
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch employees');
      setLoading(false);
      // For demo purposes, adding mock data
      setEmployees([
        {
          id: 1,
          name: 'John Doe',
          email: 'john@peoplex.com',
          department: 'Engineering',
          position: 'Senior Developer',
          status: 'Active',
          joinDate: '2023-01-15'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@peoplex.com',
          department: 'HR',
          position: 'HR Manager',
          status: 'Active',
          joinDate: '2023-02-01'
        },
        // Add more mock employees here
      ]);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    Object.values(employee).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="employees-container">
      <div className="employees-header">
        <h1>Employees</h1>
        <div className="header-actions">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/employees/new" className="add-employee-btn">
            <i className="fas fa-plus"></i>
            Add Employee
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading employees...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="employees-table-container">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="employee-name">
                      <img
                        src={`https://ui-avatars.com/api/?name=${employee.name}&background=random`}
                        alt={employee.name}
                        className="employee-avatar"
                      />
                      {employee.name}
                    </div>
                  </td>
                  <td>{employee.email}</td>
                  <td>{employee.department}</td>
                  <td>{employee.position}</td>
                  <td>
                    <span className={`status-badge ${employee.status.toLowerCase()}`}>
                      {employee.status}
                    </span>
                  </td>
                  <td>{new Date(employee.joinDate).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="action-btn delete">
                        <i className="fas fa-trash"></i>
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

export default Employees; 