import { useState } from "react";
import AddPlayerModal from "../components/AddPlayerModal";
import PlayersList from "../components/PlayersList";
import { usePlayers, useAppLoading, useAppHasErrors, useAppErrors } from "../store";
import { Card, CardBody, CardTitle } from "../components/ui";
import Button from "../components/ui/Button";

export default function PlayersPage() {
  const {
    players,
    addPlayer: addPlayerToStore
  } = usePlayers();
  
  // Use individual selectors instead of loading/error from old hook
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddPlayer = async (
    playerData: Omit<import("../types").Player, "id">
  ) => {
    const success = await addPlayerToStore(playerData);
    if (success) {
      setIsModalOpen(false);
    }
  };

  if (isLoading) {
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
      {hasErrors && errors.players && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.players}
        </div>
      )}

      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>
              All Players ({players.length})
            </CardTitle>
            <Button
              variant="primary" size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              Add
            </Button>
          </div>

          <PlayersList
            players={players}
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
