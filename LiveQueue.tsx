import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { Clock, Bell, AlertCircle, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Mock data (assuming useQueue provides this or similar structure)
const mockPatients = [
  {
    id: '1',
    name: 'John Smith',
    department: 'General',
    priority: 'medium',
    status: 'waiting',
    estimatedWaitTime: 30,
    queuePosition: 2,
    arrivalTime: new Date().toISOString(), // Adding arrivalTime for consistency
  },
  {
    id: '2',
    name: 'Jane Doe',
    department: 'General',
    priority: 'medium',
    status: 'waiting',
    estimatedWaitTime: 30,
    queuePosition: 1,
    arrivalTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
  },
];

const mockDepartments = [
  { id: '1', name: 'Emergency', currentLoad: 75, averageWaitTime: 5, patientsWaiting: 0 },
  { id: '2', name: 'General', currentLoad: 50, averageWaitTime: 30, patientsWaiting: 2 },
];

interface Patient {
  id: string;
  name: string;
  department: string;
  priority: string;
  status: string;
  estimatedWaitTime?: number;
  queuePosition?: number;
  arrivalTime?: string; // Added for consistency
}

const LiveQueue: React.FC = () => {
  const { patients: contextPatients, departments: contextDepartments, loading, error, refreshData } = useQueue();
  const [patients, setPatients] = useState<Patient[]>(contextPatients || mockPatients); // Fallback to mock data
  const [departments, setDepartments] = useState(contextDepartments || mockDepartments); // Fallback to mock data
  const [patientId, setPatientId] = useState<string>(''); 
  const [notifications, setNotifications] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        try {
          refreshData();
          if (patientId && searchResult?.patient) {
            handleSearch();
          }
        } catch (err) {
          console.error('Auto-refresh failed:', err);
        }
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refreshData, patientId, searchResult]);

  useEffect(() => {
    // Update local state when context data changes
    setPatients(contextPatients || mockPatients);
    setDepartments(contextDepartments || mockDepartments);
  }, [contextPatients, contextDepartments]);

  const handleSearch = () => {
    if (!patientId.trim()) {
      setSearchResult({ error: 'Please enter a patient ID' });
      return;
    }
    
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setSearchResult({ patient });
      if (patient.status === 'waiting') {
        setNotifications(true);
      } else if (patient.status === 'in-progress') {
        setNotifications(false);
      }
    } else {
      setSearchResult({ error: 'Patient not found' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQueuePosition = (patient: Patient) => {
    if (patient.status !== 'waiting') return null;
    const departmentPatients = patients.filter(
      p => p.department === patient.department && p.status === 'waiting'
    ).sort((a, b) => {
      const priorityOrder = { emergency: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    return departmentPatients.findIndex(p => p.id === patient.id) + 1;
  };

  const getEstimatedTime = (patient: Patient) => {
    if (patient.status !== 'waiting') return null;
    const department = departments.find(d => d.name === patient.department);
    if (!department) return null;
    
    let baseTime = department.averageWaitTime;
    const position = getQueuePosition(patient);
    
    // Adjust based on priority
    switch (patient.priority) {
      case 'low': baseTime *= 1.5; break;
      case 'medium': baseTime *= 1; break;
      case 'high': baseTime *= 0.7; break;
      case 'emergency': baseTime *= 0.3; break;
    }

    // Adjust based on position (simplified linear scaling)
    if (position) baseTime *= position / 2;

    return Math.max(1, Math.round(baseTime)); // Ensure at least 1 minute
  };

  const handleNotificationToggle = () => {
    if (searchResult?.patient?.status === 'waiting') {
      setNotifications(!notifications);
      if (notifications) {
        alert('Notifications turned off for your queue position.');
      } else {
        alert('You will be notified when it’s your turn. Check back or listen for updates!');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  const waitingPatients = patients
    .filter(p => p.status === 'waiting')
    .sort((a, b) => {
      const priorityOrder = { emergency: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (a.estimatedWaitTime || 0) - (b.estimatedWaitTime || 0);
    });

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Live Queue Updates</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto-refresh" className="text-sm text-gray-700">
              Auto-refresh
            </label>
          </div>
          <button 
            onClick={refreshData}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Patient Lookup */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Track Your Position</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter your Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Find My Position
          </button>
        </div>

        {searchResult && (
          <div className="mt-4">
            {searchResult.error ? (
              <p className="text-red-500">{searchResult.error}</p>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{searchResult.patient.name}</h3>
                    <p className="text-gray-600">Patient ID: {searchResult.patient.id}</p>
                    <p className="text-gray-600">Department: {searchResult.patient.department}</p>
                    <p className="text-gray-600">
                      Priority: 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(searchResult.patient.priority)}`}>
                        {searchResult.patient.priority}
                      </span>
                    </p>
                  </div>
                  <div className="text-center">
                    {searchResult.patient.status === 'waiting' && (
                      <>
                        <div className="text-3xl font-bold text-blue-600">{getQueuePosition(searchResult.patient)}</div>
                        <p className="text-sm text-gray-600">Current Position</p>
                      </>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-md ${getStatusColor(searchResult.patient.status)} mb-4`}>
                  <p className="text-lg font-semibold">
                    Status: {searchResult.patient.status.replace('-', ' ').toUpperCase()}
                  </p>
                  {searchResult.patient.status === 'waiting' && (
                    <p className="text-sm mt-1">
                      Estimated wait time: <strong>{getEstimatedTime(searchResult.patient) || 'N/A'} minutes</strong>
                    </p>
                  )}
                  {searchResult.patient.status === 'in-progress' && searchResult.patient.arrivalTime && (
                    <p className="text-sm mt-1">
                      Started at: <strong>{format(parseISO(searchResult.patient.arrivalTime), 'h:mm a')}</strong>
                    </p>
                  )}
                </div>

                {searchResult.patient.status === 'in-progress' && searchResult.patient.arrivalTime && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="font-medium text-blue-800">
                      <Bell size={16} className="inline mr-2" />
                      Now Serving: You are currently being seen.
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Started at {format(parseISO(searchResult.patient.arrivalTime), 'h:mm a')}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Please proceed to your assigned room in {searchResult.patient.department}.
                    </p>
                  </div>
                )}

                {searchResult.patient.status === 'waiting' && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center">
                      <Clock size={20} className="text-blue-500 mr-2" />
                      <span>Estimated wait time: <strong>{getEstimatedTime(searchResult.patient) || 'N/A'} minutes</strong></span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifications"
                        checked={notifications}
                        onChange={handleNotificationToggle}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notifications" className="text-sm">
                        Notify me when it's my turn
                      </label>
                    </div>
                  </div>
                )}

                {searchResult.patient.status === 'completed' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <p className="font-medium text-green-800">
                      Your appointment has been completed. Thank you for visiting.
                    </p>
                  </div>
                )}

                {searchResult.patient.status === 'cancelled' && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md">
                    <p className="font-medium text-red-800">
                      Your appointment has been cancelled. Please check with reception.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Queue Display */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Queue Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => (
            <div key={dept.id} className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{dept.name}</h3>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Patients waiting: {dept.patientsWaiting}</span>
                <span className="text-gray-600">Avg. wait: {dept.averageWaitTime} min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className={`h-2.5 rounded-full ${
                    dept.currentLoad > 75 ? 'bg-red-500' : 
                    dept.currentLoad > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`} 
                  style={{ width: `${dept.currentLoad}%` }}
                ></div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {waitingPatients
                  .filter(p => p.department === dept.name)
                  .map((patient, index) => (
                    <div 
                      key={patient.id} 
                      className={`flex justify-between items-center p-2 rounded-md ${
                        index === 0 ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          {getQueuePosition(patient) || index + 1}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
                          {patient.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        ~{getEstimatedTime(patient) || 'N/A'} min
                      </div>
                    </div>
                  ))}
                {waitingPatients.filter(p => p.department === dept.name).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No patients currently waiting</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Now Serving */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">Now Serving</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const inProgress = patients.filter(
              p => p.department === dept.name && p.status === 'in-progress' && p.arrivalTime
            );
            return (
              <div key={dept.id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{dept.name}</h3>
                {inProgress.length > 0 ? (
                  <div className="space-y-2">
                    {inProgress.map(patient => (
                      <div key={patient.id} className="bg-blue-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{patient.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
                            {patient.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Started at {format(parseISO(patient.arrivalTime!), 'h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No patients currently being served</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LiveQueue;