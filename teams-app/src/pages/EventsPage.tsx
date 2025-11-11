import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import EventsList from '../components/EventsList';
import AddEventModal from '../components/AddEventModal';
import type { Team } from '../types';
import { Card, CardBody, CardTitle } from '../components/ui';
import Button from '../components/ui/Button';

export default function EventsPage() {
  const navigate = useNavigate();
  const { events, loading, error, addEvent } = useEvents();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

  // Split events into future and past
  const futureEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  const pastEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  });

  const handleAddEvent = async (eventData: { 
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
      strength: 2, // Default strength
      startTime: eventData.startTime, // All teams get the same start time initially
      selectedPlayers: [], // Players will be assigned during selection
    }));

    const success = await addEvent({
      name: eventData.name,
      date: eventData.date,
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Future Events Section */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>Future Events ({futureEvents.length})</CardTitle>
              <Button 
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                Add
              </Button>
            </div>
            
            <EventsList 
              events={futureEvents} 
              onEventClick={handleEventClick}
            />
          </CardBody>
        </Card>

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <Card>
            <CardBody>
              <CardTitle>Past Events ({pastEvents.length})</CardTitle>
              
              <EventsList 
                events={pastEvents} 
                onEventClick={handleEventClick}
              />
            </CardBody>
          </Card>
        )}
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddEvent}
      />
    </div>
  );
}