import { 
  fetchPatients, 
  fetchDepartments, 
  fetchQueueAnalytics, 
  fetchPredictionData,
  updatePatientStatus,
  addNewPatient,
  authenticateUser,
  getPatientById
} from '../data/mockData';
import { Patient, Department, QueueAnalytics, PredictionData, User } from './index'; // Adjust path

let mockUsers: User[] = JSON.parse(localStorage.getItem('mockUsers') || '[]');

export const QueueService = {
  getPatients: (): Promise<Patient[]> => {
    return fetchPatients();
  },
  
  getDepartments: (): Promise<Department[]> => {
    return fetchDepartments();
  },
  
  getQueueAnalytics: (): Promise<QueueAnalytics[]> => {
    return fetchQueueAnalytics();
  },
  
  getPredictionData: (): Promise<PredictionData[]> => {
    return fetchPredictionData();
  },
  
  updatePatientStatus: (patientId: string, status: Patient['status']): Promise<Patient> => {
    return updatePatientStatus(patientId, status);
  },
  
  addPatient: (name: string, department: string, priority: Patient['priority']): Promise<Patient> => {
    return addNewPatient(name, department, priority);
  },
  
  getPredictedWaitTime: (departmentId: string, priority: Patient['priority']): Promise<number> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const baseTime = Math.floor(Math.random() * 30) + 15;
        let multiplier = 1;
        
        switch(priority) {
          case 'low':
            multiplier = 1.5;
            break;
          case 'medium':
            multiplier = 1;
            break;
          case 'high':
            multiplier = 0.7;
            break;
          case 'emergency':
            multiplier = 0.3;
            break;
        }
        
        resolve(Math.round(baseTime * multiplier));
      }, 300);
    });
  },

  login: (username: string, password: string): Promise<User | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = mockUsers.find(
          u => u.username === username && u.password === password
        );
        if (user) {
          resolve(user);
        } else {
          authenticateUser(username, password).then(resolve);
        }
      }, 300);
    });
  },

  signup: (
    username: string,
    password: string,
    email: string,
    type: 'patient' | 'admin',
    phoneNumber?: string,
    gender?: 'male' | 'female' | 'other',
    age?: number,
    diseases?: string[],
    employeeId?: string,
    staffDepartment?: string
  ): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userExists = mockUsers.some(
          user => user.username === username || user.email === email
        );

        if (userExists) {
          reject(new Error('Username or email already exists'));
          return;
        }

        const newUser: User = {
          id: `user-${Math.random().toString(36).substr(2, 9)}`,
          username,
          password,
          email,
          role: type,
          name: `${type === 'patient' ? 'Patient' : 'Admin'} ${username}`,
          patientId: type === 'patient' ? `pat-${Math.random().toString(36).substr(2, 9)}` : undefined,
          phoneNumber: type === 'patient' ? phoneNumber : undefined,
          gender: type === 'patient' ? gender : undefined,
          age: type === 'patient' ? age : undefined,
          diseases: type === 'patient' ? diseases : undefined,
          employeeId: type === 'admin' ? employeeId : undefined,
          staffDepartment: type === 'admin' ? staffDepartment : undefined
        };

        mockUsers.push(newUser);
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
        resolve(newUser);
      }, 300);
    });
  },

  getPatientById: (patientId: string): Promise<Patient | null> => {
    return getPatientById(patientId);
  }
};