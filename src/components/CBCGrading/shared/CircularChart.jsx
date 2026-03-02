/**
 * Circular Progress Chart Component
 * Reusable component for displaying percentage data in circular/donut chart
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CircularChart = ({
  data,
  title,
  type = 'pie', // 'pie' or 'donut'
  size = 200,
  showLegend = true,
  showTooltip = true,
  centerLabel = null
}) => {
  const COLORS = {
    // CBC Rubric Colors
    EE: '#10b981', // Green
    ME: '#3b82f6', // Blue
    AE: '#f59e0b', // Yellow
    BE: '#ef4444', // Red
    
    // Status Colors
    Active: '#10b981',
    Inactive: '#6b7280',
    Exited: '#ef4444',
    Transferred: '#8b5cf6',
    
    // Attendance Colors
    Present: '#10b981',
    Absent: '#ef4444',
    Late: '#f59e0b',
    Excused: '#3b82f6',
    
    // Grade Colors
    A: '#10b981',
    B: '#3b82f6',
    C: '#f59e0b',
    D: '#fb923c',
    E: '#ef4444',
    
    // Gender Colors
    Male: '#3b82f6',
    Female: '#ec4899',
    
    // Default palette
    default: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  };

  const getColor = (name, index) => {
    if (COLORS[name]) return COLORS[name];
    if (Array.isArray(COLORS.default)) return COLORS.default[index % COLORS.default.length];
    return '#3b82f6';
  };

  const renderCenterLabel = () => {
    if (!centerLabel || type !== 'donut') return null;
    
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-gray-800">{centerLabel.value}</div>
        <div className="text-sm text-gray-600">{centerLabel.label}</div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">
            Value: <span className="font-bold" style={{ color: data.payload.fill }}>{data.value}</span>
          </p>
          {data.payload.percentage && (
            <p className="text-sm text-gray-600">
              Percentage: <span className="font-bold">{data.payload.percentage}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      {title && (
        <h4 className="text-center font-semibold text-gray-800 mb-4">{title}</h4>
      )}
      
      <div className="relative" style={{ height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={size / 2 - 10}
              innerRadius={type === 'donut' ? (size / 2 - 10) * 0.6 : 0}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || getColor(entry.name, index)} 
                />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
        {renderCenterLabel()}
      </div>
    </div>
  );
};

export default CircularChart;
