import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import EventsList from '../components/EventsList';
import AddEventModal from '../components/AddEventModal';
import type { Team } from '../types';

export default function EventsPage() {
  const navigate = useNavigate();
  const { events, addEvent } = useEvents();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddEvent = (eventData: { 
    name: string; 
    date: string; 
    startTime: string; 
    numberOfTeams: number; 
    maxPlayersPerTeam: number 
  }) => {
    // Create teams for the event
    const teams: Team[] = Array.from({ length: eventData.numberOfTeams }, (_, index) => ({
      id: crypto.randomUUID(),
      name: `Team ${index + 1}`,
      selectedPlayers: [], // Players will be assigned during selection
    }));

    const success = addEvent({
      name: eventData.name,
      date: eventData.date,
      startTime: eventData.startTime,
      maxPlayersPerTeam: eventData.maxPlayersPerTeam,
      teams,
      invitations: [],
    });

    if (success) {
      console.log('Event created successfully');
    } else {
      console.error('Failed to create event');
    }
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        <p className="mt-2 text-gray-600">
          View and manage soccer events and team selections.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Events</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Event
          </button>
        </div>
        
        <EventsList events={events} onEventClick={handleEventClick} />
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddEvent}
      />
    </div>
  );
}