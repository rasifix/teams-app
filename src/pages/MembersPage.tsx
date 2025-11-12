import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import AddPlayerModal from "../components/AddPlayerModal";
import AddTrainerModal from "../components/AddTrainerModal";
import MembersList from "../components/MembersList";
import ConfirmDialog from "../components/ConfirmDialog";
import { usePlayers, useTrainers, useAppLoading, useAppHasErrors, useAppErrors } from "../store";
import { Card, CardBody, CardTitle } from "../components/ui";
import Button from "../components/ui/Button";
import type { Player, Trainer } from "../types";

export default function MembersPage() {
  const location = useLocation();
  
  // Store hooks
  const { players, addPlayer: addPlayerToStore, deletePlayer } = usePlayers();
  const { trainers, addTrainer, deleteTrainer } = useTrainers();
  
  // Use individual selectors for loading/error states
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  // Modal states
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  
  // Edit states - removed editingTrainer since we navigate to detail page
  
  // Delete confirmation states
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [deletingTrainer, setDeletingTrainer] = useState<Trainer | null>(null);

  // Determine active tab based on URL
  const isPlayersTab = location.pathname === '/members' || location.pathname === '/members/players';
  const isTrainersTab = location.pathname === '/members/trainers';

  // Player handlers
  const handleAddPlayer = async (playerData: Omit<Player, "id">) => {
    const success = await addPlayerToStore(playerData);
    if (success) {
      setIsPlayerModalOpen(false);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    setDeletingPlayer(player);
  };

  const confirmDeletePlayer = async () => {
    if (deletingPlayer) {
      try {
        const success = await deletePlayer(deletingPlayer.id);
        setDeletingPlayer(null); // Always close dialog
        if (!success) {
          console.error('Failed to delete player');
        }
      } catch (error) {
        setDeletingPlayer(null); // Close dialog even on error
        console.error('Error deleting player:', error);
      }
    }
  };

  const cancelDeletePlayer = () => {
    setDeletingPlayer(null);
  };

  // Trainer handlers
  const handleAddTrainer = async (trainerData: Omit<Trainer, "id">) => {
    const success = await addTrainer(trainerData);
    if (success) {
      setIsTrainerModalOpen(false);
    }
  };

  const handleDeleteTrainer = (trainer: Trainer) => {
    setDeletingTrainer(trainer);
  };

  const confirmDeleteTrainer = async () => {
    if (deletingTrainer) {
      try {
        const success = await deleteTrainer(deletingTrainer.id);
        
        if (!success) {
          console.error('Failed to delete trainer');
        }
      } catch (error) {
        console.error('Error deleting trainer:', error);
      } finally {
        setDeletingTrainer(null); // Always close dialog in finally block
      }
    }
  };

  const cancelDeleteTrainer = () => {
    setDeletingTrainer(null);
  };

  const handleCloseTrainerModal = () => {
    setIsTrainerModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {hasErrors && (errors.players || errors.trainers) && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.players || errors.trainers}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8" aria-label="Tabs">
          <NavLink
            to="/members/players"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive || isPlayersTab
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Players ({players.length})
          </NavLink>
          <NavLink
            to="/members/trainers"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive || isTrainersTab
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Trainers ({trainers.length})
          </NavLink>
        </nav>
      </div>

      {/* Players Tab Content */}
      {(isPlayersTab) && (
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>All Players ({players.length})</CardTitle>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPlayerModalOpen(true)}
              >
                Add
              </Button>
            </div>

            <MembersList
              members={players}
              onDelete={handleDeletePlayer}
              memberType="players"
            />
          </CardBody>
        </Card>
      )}

      {/* Trainers Tab Content */}
      {isTrainersTab && (
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <CardTitle>All Trainers ({trainers.length})</CardTitle>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsTrainerModalOpen(true)}
              >
                Add
              </Button>
            </div>

            <MembersList
              members={trainers}
              onDelete={handleDeleteTrainer}
              memberType="trainers"
            />
          </CardBody>
        </Card>
      )}

      {/* Player Modal */}
      <AddPlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onSave={handleAddPlayer}
        onUpdate={() => {}}
        editingPlayer={null}
      />

      {/* Trainer Modal */}
      <AddTrainerModal
        isOpen={isTrainerModalOpen}
        onClose={handleCloseTrainerModal}
        onSave={handleAddTrainer}
        onUpdate={() => {}}
        editingTrainer={null}
      />

      {/* Delete Player Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingPlayer)}
        title="Delete Player"
        message={`Are you sure you want to delete ${deletingPlayer?.firstName} ${deletingPlayer?.lastName}? This action cannot be undone.`}
        confirmText="Delete Player"
        cancelText="Cancel"
        onConfirm={confirmDeletePlayer}
        onCancel={cancelDeletePlayer}
      />

      {/* Delete Trainer Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingTrainer)}
        title="Delete Trainer"
        message={`Are you sure you want to delete ${deletingTrainer?.firstName} ${deletingTrainer?.lastName}? This action cannot be undone.`}
        confirmText="Delete Trainer"
        cancelText="Cancel"
        onConfirm={confirmDeleteTrainer}
        onCancel={cancelDeleteTrainer}
      />
    </div>
  );
}