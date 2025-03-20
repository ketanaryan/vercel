import React, { useState, useEffect, useRef } from 'react';
import { Clock, Users, AlertCircle, RefreshCw, Calendar, MessageSquare, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

// Mock data (since no backend is available)
const mockPatients = [
  {
    id: '1',
    name: 'John Smith',
    department: 'General',
    priority: 'medium',
    status: 'waiting',
    estimatedWaitTime: 30,
    queuePosition: 2,
  },
  {
    id: '2',
    name: 'Jane Doe',
    department: 'General',
    priority: 'medium',
    status: 'waiting',
    estimatedWaitTime: 30,
    queuePosition: 1,
  },
];

const mockDepartments = [
  { id: '1', name: 'Emergency', currentLoad: 75, averageWaitTime: 5, patientsWaiting: 0 },
  { id: '2', name: 'General', currentLoad: 50, averageWaitTime: 30, patientsWaiting: 2 },
];

const mockPredictions = [
  { hour: 10, predictedArrivals: 8, actualArrivals: 5 },
  { hour: 11, predictedArrivals: 6, actualArrivals: 0 },
  { hour: 12, predictedArrivals: 7, actualArrivals: 0 },
];

interface Patient {
  id: string;
  name: string;
  department: string;
  priority: string;
  status: string;
  estimatedWaitTime?: number;
  queuePosition?: number;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const PatientDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [departments, setDepartments] = useState(mockDepartments);
  const [predictions, setPredictions] = useState(mockPredictions);
  const [user, setUser] = useState({
    role: 'patient',
    name: 'John Smith', // Default to John Smith for testing; can be changed
    patientId: '1',     // Default to John Smith's ID for testing
  });
  const [patientId, setPatientId] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    department: '',
    date: '',
    time: '',
    reason: ''
  });
  const [appointments, setAppointments] = useState<any[]>([
    // Pre-populate with John Smith's appointment in General department if logged in as John
    user.patientId === '1' ? [
      {
        id: 'appt1',
        patientId: '1',
        patientName: 'John Smith',
        department: 'General',
        date: '2025-03-04',
        time: '10:20',
        reason: 'hello',
        status: 'scheduled',
        createdAt: new Date('2025-03-04T07:10:00').toISOString(),
      },
    ] : [],
  ]);
  const [hasBookedAppointment, setHasBookedAppointment] = useState(false); // Start without an appointment for new users
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null); // New state for cancellation feedback

  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatContext, setChatContext] = useState<string>(''); // Tracks conversation context
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize appointments and hasBookedAppointment based on user login
    const initialAppointments = user.patientId === '1' ? [
      {
        id: 'appt1',
        patientId: '1',
        patientName: 'John Smith',
        department: 'General',
        date: '2025-03-04',
        time: '10:20',
        reason: 'hello',
        status: 'scheduled',
        createdAt: new Date('2025-03-04T07:10:00').toISOString(),
      },
    ] : [];
    setAppointments(initialAppointments);
    setHasBookedAppointment(initialAppointments.length > 0);

    if (user?.role === 'patient' && user?.patientId && hasBookedAppointment) {
      const patient = patients.find(p => p.id === user.patientId);
      if (patient) {
        let updatedPatient = { ...patient };
        if (patient.department === 'Emergency') {
          updatedPatient.priority = 'emergency';
          updatedPatient.status = 'in-progress';
          updatedPatient.estimatedWaitTime = 5; // Immediate or very short wait for emergencies
        } else if (patient.department === 'General') {
          updatedPatient.priority = 'medium';
          updatedPatient.status = 'waiting';
          updatedPatient.estimatedWaitTime = 30; // Match General department wait time
        }
        setCurrentPatient(updatedPatient);
        setSearchResult({ patient: updatedPatient });
      }
    }
  }, [user, patients, hasBookedAppointment]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    // Clear cancellation success message after 3 seconds
    if (cancelSuccess) {
      const timer = setTimeout(() => setCancelSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [cancelSuccess]);

  const handleSearch = () => {
    if (!patientId.trim()) {
      setSearchResult({ error: 'Please enter a patient ID' });
      return;
    }
    
    const patient = patients.find(p => p.id === patientId);
    if (patient && hasBookedAppointment) {
      let updatedPatient = { ...patient };
      if (patient.department === 'Emergency') {
        updatedPatient.priority = 'emergency';
        updatedPatient.status = 'in-progress';
        updatedPatient.estimatedWaitTime = 5; // Immediate or very short wait
      } else if (patient.department === 'General') {
        updatedPatient.priority = 'medium';
        updatedPatient.status = 'waiting';
        updatedPatient.estimatedWaitTime = 30; // Match General department wait time
      }
      setSearchResult({ patient: updatedPatient });
    } else {
      setSearchResult({ error: 'Patient not found or no appointment booked yet' });
    }
  };

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppointment = {
      id: Date.now().toString(),
      patientId: user?.patientId || patientId,
      patientName: user.name,
      ...appointmentForm,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    // Update patient's queue status to match the new appointment department
    const updatedPatients = patients.map(p => 
      p.id === user.patientId 
        ? { 
            ...p, 
            department: newAppointment.department,
            priority: newAppointment.department === 'Emergency' ? 'emergency' : 'medium',
            status: 'waiting',
            estimatedWaitTime: newAppointment.department === 'Emergency' ? 5 : 30,
            queuePosition: newAppointment.department === 'Emergency' ? 1 : 2,
          }
        : p
    );
    setPatients(updatedPatients);

    setAppointments(prevAppointments => [...prevAppointments, newAppointment]);
    console.log('Appointment booked:', newAppointment);
    setIsAppointmentModalOpen(false);
    setAppointmentForm({ department: '', date: '', time: '', reason: '' });
    setHasBookedAppointment(true); // Ensure queue is shown after booking
  };

  const handleCancelAppointment = (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      console.log('Attempting to cancel appointment with ID:', appointmentId);
      const updatedAppointments = appointments.filter(apt => apt.id !== appointmentId);
      console.log('Updated appointments after cancellation:', updatedAppointments);

      // Update hasBookedAppointment based on whether any appointments remain
      const newHasBookedAppointment = updatedAppointments.length > 0;
      setHasBookedAppointment(newHasBookedAppointment);

      // Update patient's queue status if no appointments remain (reset or remove)
      let updatedPatients = [...patients];
      if (!newHasBookedAppointment && user.patientId) {
        updatedPatients = patients.map(p => 
          p.id === user.patientId 
            ? { 
                ...p, 
                department: '', // Clear department to indicate no active queue status
                priority: '',
                status: '',
                estimatedWaitTime: undefined,
                queuePosition: undefined,
              }
            : p
        );
      }
      setPatients(updatedPatients);
      setAppointments(updatedAppointments);
      setCurrentPatient(null); // Clear current patient data if no appointments
      setSearchResult(null);   // Clear search result if no appointments
      setCancelSuccess('Appointment canceled successfully!'); // Show success message
      console.log('Patient queue status after cancellation:', updatedPatients);
    }
  };

  // Enhanced AI chatbot logic
  const getAIResponse = async (message: string): Promise<string> => {
    const lowercaseMessage = message.toLowerCase().trim();
    const patient = currentPatient || searchResult?.patient;

    // Context-aware responses
    if (chatContext === 'appointment' || lowercaseMessage.includes('appointment')) {
      setChatContext('appointment');
      if (lowercaseMessage.includes('how') || lowercaseMessage.includes('book')) {
        return 'To book an appointment, click the "Book Appointment" button at the top right, then select your department, date, time, and reason.';
      } else if (lowercaseMessage.includes('cancel')) {
        return appointments.length > 0 
          ? 'To cancel an appointment, click the "Cancel" button next to your appointment in the "Your Appointments" section.'
          : 'You don’t have any appointments to cancel. Would you like to book one?';
      } else if (lowercaseMessage.includes('upcoming') || lowercaseMessage.includes('my appointment')) {
        return appointments.length > 0 
          ? `You have ${appointments.length} upcoming appointment(s). The next one is on ${format(new Date(appointments[0].date), 'MMMM dd, yyyy')} at ${appointments[0].time} in ${appointments[0].department}.`
          : 'You don’t have any upcoming appointments scheduled.';
      } else {
        return 'Would you like help booking an appointment, checking upcoming appointments, or cancelling an appointment?';
      }
    }

    if (chatContext === 'wait' || lowercaseMessage.includes('wait time') || lowercaseMessage.includes('waiting')) {
      setChatContext('wait');
      if (!hasBookedAppointment) {
        return 'Please book an appointment first to check wait times or queue status.';
      }
      if (!patient) {
        return 'Please enter your patient ID to check your wait time.';
      }
      if (lowercaseMessage.includes('how long')) {
        if (patient.department === 'Emergency') {
          return `As an emergency patient, you are currently being attended to with priority 'emergency'. Your wait time is estimated at ${patient.estimatedWaitTime || 5} minutes or less.`;
        }
        return patient.status === 'waiting' 
          ? `Your estimated wait time is ${patient.estimatedWaitTime} minutes. You’re currently at position ${patient.queuePosition} in the queue.`
          : 'You’re not currently in a waiting status.';
      } else if (lowercaseMessage.includes('average')) {
        const avgWait = Math.round(departments.reduce((acc, dept) => acc + dept.averageWaitTime, 0) / departments.length);
        return `The average wait time across all departments is ${avgWait} minutes right now.`;
      } else {
        return 'I can tell you your personal wait time or the average across departments. Which would you like?';
      }
    }

    if (chatContext === 'department' || lowercaseMessage.includes('department')) {
      setChatContext('department');
      const deptName = departments.find(d => lowercaseMessage.includes(d.name.toLowerCase()))?.name;
      if (deptName) {
        const dept = departments.find(d => d.name === deptName);
        return `${deptName} currently has ${dept?.patientsWaiting} patients waiting, with an average wait time of ${dept?.averageWaitTime} minutes and a load of ${dept?.currentLoad}%.`;
      } else if (lowercaseMessage.includes('list') || lowercaseMessage.includes('available')) {
        return `Available departments are: ${departments.map(d => d.name).join(', ')}. Which one would you like details about?`;
      } else {
        return 'Which department would you like information about? I can give you wait times, patient counts, or current load.';
      }
    }

    // General responses
    if (lowercaseMessage.includes('hi') || lowercaseMessage.includes('hello')) {
      return user.patientId === '1' 
        ? 'Hello, John Smith! I’m here to assist you with your appointments, wait times, or queue predictions. How can I help you today?'
        : 'Hello! I’m here to assist you with booking an appointment. How can I help you today?';
    }

    if (lowercaseMessage.includes('prediction') || lowercaseMessage.includes('arrivals')) {
      if (!hasBookedAppointment) {
        return 'Please book an appointment first to access queue predictions.';
      }
      const currentHour = new Date().getHours();
      const currentPrediction = predictions.find(p => p.hour === currentHour) || predictions[0];
      const nextPrediction = predictions.find(p => p.hour === currentHour + 1) || predictions[1];
      return `For the current hour (${currentHour}:00), we predict ${currentPrediction?.predictedArrivals || 0} arrivals. Next hour, we expect ${nextPrediction?.predictedArrivals || 0}.`;
    }

    // Default fallback
    setChatContext('');
    return user.patientId === '1' 
      ? 'I can help with managing your appointments, wait times, department info, or queue predictions. What would you like to know about?'
      : 'I can help with booking an appointment. What would you like to know about?';
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    const aiResponse = await getAIResponse(chatInput);
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: aiResponse,
      isUser: false,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, aiMessage]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
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

  const currentHour = new Date().getHours();
  const currentPrediction = predictions.find(p => p.hour === currentHour) || predictions[0];
  const nextPrediction = predictions.find(p => p.hour === currentHour + 1) || predictions[1];

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {user?.role === 'patient' ? `Welcome, ${user.name}` : 'Patient Dashboard'}
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAppointmentModalOpen(true)}
            className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            <Calendar size={16} className="mr-2" />
            Book Appointment
          </button>
          <button 
            onClick={() => {
              setPatients([...mockPatients]); // Refresh with mock data
              setDepartments([...mockDepartments]);
              setPredictions([...mockPredictions]);
            }}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Cancellation Success Message */}
      {cancelSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {cancelSuccess}
        </div>
      )}

      {/* Appointment Modal */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Book an Appointment</h2>
            <form onSubmit={handleAppointmentSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Department</label>
                <select
                  value={appointmentForm.department}
                  onChange={(e) => setAppointmentForm({...appointmentForm, department: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Date</label>
                <input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Time</label>
                <input
                  type="time"
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Reason</label>
                <textarea
                  value={appointmentForm.reason}
                  onChange={(e) => setAppointmentForm({...appointmentForm, reason: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chatbot Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Chat with Health Assistant"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chatbot Window */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
          <div className="p-3 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Health Assistant</h3>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
          
          <div 
            ref={chatContainerRef}
            className="flex-1 p-3 overflow-y-auto max-h-64"
          >
            {chatMessages.length === 0 ? (
              <p className="text-gray-500 text-center text-sm">Ask me about booking an appointment or queue status!</p>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-2 flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-2 rounded-lg ${
                      message.isUser 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {format(message.timestamp, 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Show only if an appointment has been booked for the logged-in user */}
      {hasBookedAppointment && user.patientId === '1' && ( // Only show for John Smith
        <>
          {/* Patient Information (if logged in as John Smith) */}
          {currentPatient && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3">Your Queue Status</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-lg">{currentPatient.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-gray-600">Department: {currentPatient.department}</p>
                    <p className="text-gray-600">
                      Status: 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentPatient.status)}`}>
                        {currentPatient.status.replace('-', ' ')}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      Priority: 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(currentPatient.priority)}`}>
                        {currentPatient.priority}
                      </span>
                    </p>
                    {currentPatient.status === 'waiting' && currentPatient.department !== 'Emergency' && (
                      <>
                        <p className="text-gray-600">Queue Position: {currentPatient.queuePosition}</p>
                        <p className="text-gray-600">Estimated Wait: {currentPatient.estimatedWaitTime} minutes</p>
                      </>
                    )}
                    {currentPatient.department === 'Emergency' && (
                      <p className="text-gray-600">Estimated Wait: {currentPatient.estimatedWaitTime || 5} minutes or less (priority emergency)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search for patient (only if not logged in as John Smith, but still needing appointment) */}
          {!currentPatient && user.patientId === '1' && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3">Find Your Queue Status</h2>
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
                  Check Status
                </button>
              </div>

              {searchResult && !currentPatient && (
                <div className="mt-4">
                  {searchResult.error ? (
                    <p className="text-red-500">{searchResult.error}</p>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-semibold text-lg">{searchResult.patient.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-gray-600">Department: {searchResult.patient.department}</p>
                          <p className="text-gray-600">
                            Status: 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(searchResult.patient.status)}`}>
                              {searchResult.patient.status.replace('-', ' ')}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            Priority: 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(searchResult.patient.priority)}`}>
                              {searchResult.patient.priority}
                            </span>
                          </p>
                          {searchResult.patient.status === 'waiting' && searchResult.patient.department !== 'Emergency' && (
                            <>
                              <p className="text-gray-600">Queue Position: {searchResult.patient.queuePosition}</p>
                              <p className="text-gray-600">Estimated Wait: {searchResult.patient.estimatedWaitTime} minutes</p>
                            </>
                          )}
                          {searchResult.patient.department === 'Emergency' && (
                            <p className="text-gray-600">Estimated Wait: {searchResult.patient.estimatedWaitTime || 5} minutes or less (priority emergency)</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Appointments Section with Cancel Option (only for John Smith) */}
          {(currentPatient || searchResult?.patient) && appointments.length > 0 && user.patientId === '1' && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">Your Appointments</h2>
              <div className="space-y-4">
                {appointments
                  .filter(apt => apt.patientId === user.patientId)
                  .map((appointment) => (
                    <div key={appointment.id} className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600">Department: {appointment.department}</p>
                          <p className="text-gray-600">
                            Status: 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </p>
                          <p className="text-gray-600">Reason: {appointment.reason}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            Date: {format(new Date(appointment.date), 'MMMM dd, yyyy')}
                          </p>
                          <p className="text-gray-600">Time: {appointment.time}</p>
                          <p className="text-gray-600 text-sm">
                            Booked: {format(new Date(appointment.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="mt-2 flex items-center px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                          >
                            <Trash2 size={16} className="mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Queue Overview (only for John Smith) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {user.patientId === '1' && (
              <>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center mb-3">
                    <Users size={20} className="text-blue-500 mr-2" />
                    <h2 className="text-lg font-semibold">Current Queue</h2>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {patients.filter(p => p.status === 'waiting' && p.department).length}
                  </div>
                  <p className="text-gray-600">Patients waiting</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center mb-3">
                    <Clock size={20} className="text-green-500 mr-2" />
                    <h2 className="text-lg font-semibold">Average Wait Time</h2>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {departments.length > 0 
                      ? `${Math.round(departments.reduce((acc, dept) => acc + dept.averageWaitTime, 0) / departments.length)} min`
                      : 'N/A'}
                  </div>
                  <p className="text-gray-600">Across all departments</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center mb-3">
                    <AlertCircle size={20} className="text-orange-500 mr-2" />
                    <h2 className="text-lg font-semibold">Predicted Arrivals</h2>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    {currentPrediction?.predictedArrivals || 0}
                  </div>
                  <p className="text-gray-600">Expected in the current hour</p>
                </div>
              </>
            )}
          </div>

          {/* Department Status (only for John Smith) */}
          {user.patientId === '1' && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">Department Status</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Load</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Wait Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patients Waiting</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {departments.map((dept) => (
                      <tr key={dept.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                dept.currentLoad > 75 ? 'bg-red-500' : 
                                dept.currentLoad > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`} 
                              style={{ width: `${dept.currentLoad}%` }}
                            ></div>
                          </div>
                          <span className="text-xs mt-1 inline-block">{dept.currentLoad}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.averageWaitTime} min</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.patientsWaiting}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Predicted Patient Arrivals (only for John Smith) */}
          {user.patientId === '1' && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Predicted Patient Arrivals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Current Hour ({currentHour}:00 - {currentHour + 1}:00)</h3>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Predicted:</span>
                      <span className="font-semibold">{currentPrediction?.predictedArrivals || 'N/A'} patients</span>
                    </div>
                    {currentPrediction?.actualArrivals !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Actual so far:</span>
                        <span className="font-semibold">{currentPrediction.actualArrivals} patients</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Next Hour ({currentHour + 1}:00 - {currentHour + 2}:00)</h3>
                  <div className="bg-purple-50 p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Predicted:</span>
                      <span className="font-semibold">{nextPrediction?.predictedArrivals || 'N/A'} patients</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientDashboard;