import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { enGB } from 'date-fns/locale'; // Fallback to enGB if needed, or stick to enUS
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../../../../services/api';
import { Plus, Video, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Setup the localizer by providing the date-fns (or moment, or globalize) Object
const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const CalendarView = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const [currentTerm, setCurrentTerm] = useState(null);
    const [termLabel, setTermLabel] = useState('');

    const getMonthRange = (referenceDate) => {
        const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    };

    // Fetch events
    const fetchEvents = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            const response = await api.planner.getEvents(params);
            if (response.success) {
                const formattedEvents = response.data.map(evt => ({
                    id: evt.id,
                    title: evt.title,
                    start: new Date(evt.startDate),
                    end: new Date(evt.endDate),
                    allDay: evt.allDay,
                    resource: evt
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

    const fetchTermConfig = useCallback(async () => {
        try {
            const response = await api.config.getTermConfigs();
            const terms = response.data || response || [];
            const active = terms.find(term => term.isActive);

            if (active) {
                setCurrentTerm(active);
                setTermLabel(`${active.term} ${active.academicYear}`);
                await fetchEvents({
                    start: new Date(active.startDate).toISOString(),
                    end: new Date(active.endDate).toISOString()
                });
            } else {
                const range = getMonthRange(date);
                setTermLabel('Current month');
                await fetchEvents(range);
            }
        } catch (error) {
            console.error('Error loading term configuration:', error);
            toast.error('Failed to load academic term configuration');
            await fetchEvents();
        }
    }, [date, fetchEvents]);

    useEffect(() => {
        fetchTermConfig();
    }, [fetchTermConfig]);

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
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        {format(date, 'MMMM yyyy')}
                    </h2>
                    <p className="text-sm text-gray-500">Showing events for: <span className="font-medium text-gray-700">{termLabel || 'Active term'}</span></p>
                </div>
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
