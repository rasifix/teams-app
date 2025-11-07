import { useState } from "react";
import AddPlayerModal from "../components/AddPlayerModal";
import PlayersList from "../components/PlayersList";
import { usePlayers } from "../hooks/usePlayers";
import { Card, CardBody, CardTitle } from "../components/ui";
import Button from "../components/ui/Button";

export default function PlayersPage() {
  const { players, loading, error, addPlayer } = usePlayers();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddPlayer = async (
    playerData: Omit<import("../types").Player, "id">
  ) => {
    const success = await addPlayer(playerData);
    if (success) {
      setIsModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Loading players...</p>
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

      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>
              All Players ({players.length})
            </CardTitle>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
            >
              Add Player
            </Button>
          </div>

          <PlayersList
            players={players}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </CardBody>
      </Card>

      <AddPlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddPlayer}
        onUpdate={() => {}}
        editingPlayer={null}
      />
    </div>
  );
}
