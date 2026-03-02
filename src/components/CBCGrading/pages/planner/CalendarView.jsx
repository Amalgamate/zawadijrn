import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../../../../services/api';
import { Plus, Video, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Setup the localizer by providing the moment (or globalize, or Date) Object
const localizer = momentLocalizer(moment);

const CalendarView = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // Fetch events
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            // Construct date range based on current view/date if needed, 
            // but simpler to fetch all or use a broad range for now.
            const response = await api.planner.getEvents();
            if (response.success) {
                // Transform for BigCalendar
                const formattedEvents = response.data.map(evt => ({
                    id: evt.id,
                    title: evt.title,
                    start: new Date(evt.startDate),
                    end: new Date(evt.endDate),
                    allDay: evt.allDay,
                    resource: evt, // Store full object
                }));
                setEvents(formattedEvents);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Handle slot selection (create event)
    const handleSelectSlot = ({ start, end }) => {
        const title = window.prompt('New Event Name');
        if (title) {
            // Simple creation for now - ideally utilize a modal
            const newEvent = {
                title,
                startDate: start,
                endDate: end,
                allDay: view === 'month'
            };

            api.planner.createEvent(newEvent).then(res => {
                if (res.success) {
                    toast.success('Event created');
                    fetchEvents();
                }
            }).catch(err => {
                toast.error(err.message);
            });
        }
    };

    const handleSelectEvent = (event) => {
        // Show details modal
        alert(`Event: ${event.title}\n${event.resource.description || ''}`);
    };

    const eventStyleGetter = (event, start, end, isSelected) => {
        let backgroundColor = '#3174ad';
        if (event.resource.type === 'HOLIDAY') backgroundColor = '#e53e3e';
        if (event.resource.type === 'MEETING') backgroundColor = '#805ad5';
        if (event.resource.link) backgroundColor = '#38a169'; // Google meet link?

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div className="h-[calc(100vh-140px)] bg-white rounded-lg shadow p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                    {moment(date).format('MMMM YYYY')}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchEvents}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => alert('Feature coming soon: Detailed Modal')}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-teal-700 transition"
                    >
                        <Plus size={18} />
                        Create Event
                    </button>
                </div>
            </div>

            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day', 'agenda']}
            />
        </div>
    );
};

export default CalendarView;
