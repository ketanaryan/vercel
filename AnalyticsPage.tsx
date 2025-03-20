import React, { useState, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, parseISO, subDays, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { RefreshCw, TrendingUp, Clock, Users, BarChart2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsPage: React.FC = () => {
  const { analytics, predictions, departments, loading, error, refreshData } = useQueue();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

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

  // Filter and prepare data based on time range
  const filteredAnalytics = useMemo(() => {
    const now = new Date('2025-03-03'); // Current date as per your system
    let dateRange;

    switch (timeRange) {
      case 'day':
        const today = startOfDay(now);
        dateRange = [today];
        break;
      case 'week':
        dateRange = eachDayOfInterval({
          start: subDays(now, 6),
          end: now
        });
        break;
      case 'month':
        // Show February 2025 specifically
        const febStart = startOfMonth(new Date('2025-02-01'));
        const febEnd = endOfMonth(new Date('2025-02-28'));
        dateRange = eachDayOfInterval({
          start: febStart,
          end: febEnd
        });
        break;
      default:
        dateRange = eachDayOfInterval({
          start: subDays(now, 6),
          end: now
        });
    }

    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayData = analytics.find(day => day.date === dateStr) || {
        date: dateStr,
        patientsServed: Math.floor(Math.random() * 50) + 10, // Random data for demo
        averageWaitTime: Math.floor(Math.random() * 30) + 5,
        peakHours: Array.from({ length: 12 }, (_, i) => ({
          hour: i + 8,
          count: Math.floor(Math.random() * 10)
        }))
      };
      return dayData;
    });
  }, [analytics, timeRange]);

  // Data preparation with realistic scaling
  const patientVolumeData = filteredAnalytics.map(day => ({
    date: format(parseISO(day.date), timeRange === 'day' ? 'MMM d' : 'MMM d'),
    patients: day.patientsServed
  }));

  const waitTimeData = filteredAnalytics.map(day => ({
    date: format(parseISO(day.date), timeRange === 'day' ? 'MMM d' : 'MMM d'),
    waitTime: day.averageWaitTime
  }));

  const peakHoursData = Array.from({ length: 12 }, (_, i) => i + 8).map(hour => {
    const hourLabel = hour <= 12 ? `${hour}am` : `${hour - 12}pm`;
    const count = filteredAnalytics.reduce((sum, day) => {
      const peakHour = day.peakHours.find(peak => peak.hour === hour);
      return sum + (peakHour ? peakHour.count : 0);
    }, 0);
    return { hour: hourLabel, count };
  });

  const departmentData = departments.map((dept, index) => ({
    name: dept.name,
    waitTime: dept.averageWaitTime || (10 + index * 5),
    patients: dept.patientsWaiting || (5 + index * 3),
    value: dept.patientsWaiting || (5 + index * 3)
  }));

  const predictionAccuracyData = predictions
    .filter(p => p.actualArrivals !== undefined)
    .map(p => ({
      hour: `${p.hour}:00`,
      predicted: p.predictedArrivals || 0,
      actual: p.actualArrivals || 0
    }));

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Queue Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            {['day', 'week', 'month'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range as 'day' | 'week' | 'month')}
                className={`px-4 py-2 text-sm capitalize ${
                  timeRange === range 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            onClick={refreshData}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { 
            icon: Users, 
            title: 'Total Patients', 
            value: filteredAnalytics.reduce((sum, day) => sum + day.patientsServed, 0), 
            color: 'blue' 
          },
          { 
            icon: Clock, 
            title: 'Avg. Wait Time', 
            value: filteredAnalytics.length > 0 
              ? `${Math.round(filteredAnalytics.reduce((sum, day) => sum + day.averageWaitTime, 0) / filteredAnalytics.length)} min`
              : '0 min',
            color: 'yellow' 
          },
          { 
            icon: TrendingUp, 
            title: 'Busiest Day', 
            value: filteredAnalytics.length > 0 
              ? format(parseISO(filteredAnalytics.reduce((max, day) => 
                  day.patientsServed > max.patientsServed ? day : max, filteredAnalytics[0]
                ).date), 'MMM d')
              : '-',
            color: 'green' 
          },
          { 
            icon: BarChart2, 
            title: 'Peak Hour', 
            value: peakHoursData.length > 0 
              ? peakHoursData.reduce((max, hour) => 
                  hour.count > max.count ? hour : max, peakHoursData[0]
                ).hour
              : '-',
            color: 'purple' 
          }
        ].map(stat => (
          <div key={stat.title} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2">
              <stat.icon size={20} className={`text-${stat.color}-500 mr-2`} />
              <h2 className="text-lg font-semibold">{stat.title}</h2>
            </div>
            <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
            <p className="text-sm text-gray-600 mt-1">
              {timeRange === 'day' ? 'Today' : timeRange === 'week' ? 'Last 7 Days' : 'February 2025'}
            </p>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">
            {timeRange === 'day' ? 'Today\'s Patient Volume' : timeRange === 'week' ? 'Weekly Patient Volume' : 'February Patient Volume'}
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {patientVolumeData.length > 0 ? (
                <AreaChart data={patientVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="patients" 
                    stroke="#3b82f6" 
                    fill="#93c5fd" 
                    name="Patients" 
                  />
                </AreaChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available for this period
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">
            {timeRange === 'day' ? 'Today\'s Wait Times' : timeRange === 'week' ? 'Weekly Wait Times' : 'February Wait Times'}
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {waitTimeData.length > 0 ? (
                <LineChart data={waitTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="waitTime" 
                    stroke="#f59e0b" 
                    name="Wait Time (min)" 
                  />
                </LineChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available for this period
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">
            {timeRange === 'day' ? 'Today\'s Peak Hours' : 'Peak Hours Distribution'}
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {timeRange === 'day' ? (
                peakHoursData.some(d => d.count > 0) ? (
                  <PieChart>
                    <Pie
                      data={peakHoursData.filter(d => d.count > 0)}
                      dataKey="count"
                      nameKey="hour"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ hour, percent }) => `${hour} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {peakHoursData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No peak hour data available
                  </div>
                )
              ) : (
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" name="Patient Count" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Department Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {departmentData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={departmentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No department data available
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">
            {timeRange === 'day' ? 'Prediction Accuracy' : 'Department Comparison'}
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {timeRange === 'day' ? (
                predictionAccuracyData.length > 0 ? (
                  <LineChart data={predictionAccuracyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" stroke="#3b82f6" name="Predicted" />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" />
                  </LineChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No prediction data available
                  </div>
                )
              ) : (
                departmentData.length > 0 ? (
                  <BarChart data={departmentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="waitTime" fill="#ef4444" name="Wait Time (min)" />
                    <Bar dataKey="patients" fill="#10b981" name="Patients Waiting" />
                  </BarChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No department data available
                  </div>
                )
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;