// index.ts
export interface Patient {
  id: string;
  name: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  arrivalTime: string;
  estimatedWaitTime: number; // in minutes
  department: string;
  queuePosition: number;
}

export interface Department {
  id: string;
  name: string;
  currentLoad: number; // percentage
  averageWaitTime: number; // in minutes
  patientsWaiting: number;
}

export interface QueueAnalytics {
  date: string;
  patientsServed: number;
  averageWaitTime: number;
  peakHours: {
    hour: number;
    count: number;
  }[];
}

export interface PredictionData {
  hour: number;
  predictedArrivals: number;
  actualArrivals?: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'patient';
  name: string;
  patientId?: string; // Only for patients
  email: string;
  phoneNumber?: string; // Patient-specific
  gender?: 'male' | 'female' | 'other'; // Patient-specific
  age?: number; // Patient-specific
  diseases?: string[]; // Patient-specific
  employeeId?: string; // Staff-specific
  staffDepartment?: string; // Staff-specific
}