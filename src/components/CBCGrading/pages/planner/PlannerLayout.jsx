import React from 'react';
import { Calendar, Clock, List } from 'lucide-react';
import CalendarView from './CalendarView';

const PlannerLayout = ({ currentPage, onNavigate }) => {

    const navItems = [
        { id: 'planner-calendar', icon: Calendar, label: 'Calendar' },
        { id: 'planner-timetable', icon: Clock, label: 'Timetable' },
        { id: 'planner-agenda', icon: List, label: 'Agenda' },
    ];

    const renderContent = () => {
        switch (currentPage) {
            case 'planner-calendar':
                return <CalendarView />;
            case 'planner-timetable':
                // Fallback or placeholder till integrated
                return (
                    <div className="p-8 text-center text-gray-500">
                        <Clock size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Timetable Integration</h3>
                        <p>Timetable view will be integrated here.</p>
                        <button
                            onClick={() => onNavigate('timetable')}
                            className="mt-4 px-4 py-2 bg-brand-teal text-white rounded-md"
                        >
                            Go to Main Timetable
                        </button>
                    </div>
                );
            default:
                return <CalendarView />;
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Planner Header/Nav */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">School Planner</h1>
                    <p className="text-gray-500 text-sm">Manage schedule, events, and meetings</p>
                </div>

                <nav className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === item.id
                                    ? 'bg-white text-brand-teal shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }`}
                        >
                            <item.icon size={16} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden bg-gray-50 p-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default PlannerLayout;
