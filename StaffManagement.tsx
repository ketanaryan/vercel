import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [staff, setStaff] = useState([
    { id: 'S001', name: 'Dr. Alice Brown', role: 'Doctor', department: 'Emergency', status: 'Active' },
    { id: 'S002', name: 'Nurse John Smith', role: 'Nurse', department: 'Surgery', status: 'Active' },
  ]);
  const [newStaff, setNewStaff] = useState({ id: '', name: '', role: '', department: '', status: 'Active' });

  const handleAddStaff = (e) => {
    e.preventDefault();
    setStaff([...staff, newStaff]);
    setNewStaff({ id: '', name: '', role: '', department: '', status: 'Active' });
    toast.success('Staff member added successfully');
  };

  const handleUpdateStatus = (staffId, newStatus) => {
    setStaff(staff.map(s => s.id === staffId ? { ...s, status: newStatus } : s));
    toast.success(`Staff status updated to ${newStatus}`);
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="p-4 text-red-500">
        Please log in as an admin to access this feature.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff Management</h1>

      {/* Add Staff Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Staff</h2>
        <form onSubmit={handleAddStaff} className="space-y-4">
          <input
            type="text"
            placeholder="Staff ID"
            value={newStaff.id}
            onChange={(e) => setNewStaff({ ...newStaff, id: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Name"
            value={newStaff.name}
            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <select
            value={newStaff.role}
            onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Role</option>
            <option value="Doctor">Doctor</option>
            <option value="Nurse">Nurse</option>
            <option value="Admin">Admin</option>
          </select>
          <select
            value={newStaff.department}
            onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Department</option>
            {mockDepartments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Add Staff
          </button>
        </form>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Staff</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staff.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{s.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.status}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <select
                      value={s.status}
                      onChange={(e) => handleUpdateStatus(s.id, e.target.value)}
                      className="p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Mock departments for the select dropdown (already defined in AIPredictions, but included here for completeness)
const mockDepartments = [
  { id: '1', name: 'Emergency' },
  { id: '2', name: 'Surgery' },
  { id: '3', name: 'Pediatrics' },
];

export default StaffManagement;