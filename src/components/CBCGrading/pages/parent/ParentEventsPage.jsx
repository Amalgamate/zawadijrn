import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import api from '../../../../services/api';

const formatDateTime = (value, allDay = false) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Date not available';
  if (allDay) {
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return d.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ParentEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const start = new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + 6);

      const response = await api.planner.getEvents({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const raw = response?.data || [];
      const upcoming = raw
        .map((event) => ({
          ...event,
          startDateObj: new Date(event.startDate),
        }))
        .filter((event) => !Number.isNaN(event.startDateObj.getTime()) && event.startDateObj >= start)
        .sort((a, b) => a.startDateObj - b.startDateObj);

      setEvents(upcoming);
    } catch (err) {
      console.error('Failed to load parent events:', err);
      setError('Unable to load school events right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const title = useMemo(() => `Upcoming School Events (${events.length})`, [events.length]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">School Events</h1>
            <p className="mt-1 text-sm text-gray-600">
              Closing dates, exam dates, meetings, and other upcoming activities.
            </p>
          </div>
          <button
            type="button"
            onClick={loadEvents}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600">{title}</h2>
        </div>

        {loading && (
          <div className="p-6 text-sm text-gray-500">Loading upcoming events...</div>
        )}

        {!loading && error && (
          <div className="p-6 text-sm text-rose-700">{error}</div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="p-6 text-sm text-gray-500">No upcoming school events have been posted yet.</div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{event.title || 'Untitled event'}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-violet-700">
                      {event.type || 'General'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-orange-700">
                    <CalendarDays size={12} />
                    {event.allDay ? 'All day' : 'Scheduled'}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Starts:</span> {formatDateTime(event.startDate, event.allDay)}
                  </p>
                  <p>
                    <span className="font-medium">Ends:</span> {formatDateTime(event.endDate, event.allDay)}
                  </p>
                  {event.location ? (
                    <p>
                      <span className="font-medium">Location:</span> {event.location}
                    </p>
                  ) : null}
                </div>

                {event.description ? (
                  <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{event.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentEventsPage;
