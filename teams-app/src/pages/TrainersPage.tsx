import { useState } from "react";
import AddTrainerModal from "../components/AddTrainerModal";
import TrainersList from "../components/TrainersList";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTrainers } from "../hooks/useTrainers";
import { Card, CardBody, CardTitle } from "../components/ui";
import Button from "../components/ui/Button";
import type { Trainer } from "../types";

export default function TrainersPage() {
  const { trainers, loading, error, addTrainer, updateTrainer, deleteTrainer } = useTrainers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [deletingTrainer, setDeletingTrainer] = useState<Trainer | null>(null);

  const handleAddTrainer = async (
    trainerData: Omit<Trainer, "id">
  ) => {
    const success = await addTrainer(trainerData);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleEditTrainer = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setIsModalOpen(true);
  };

  const handleUpdateTrainer = async (
    trainerId: string,
    trainerData: Omit<Trainer, "id">
  ) => {
    const success = await updateTrainer(trainerId, trainerData);
    if (success) {
      setIsModalOpen(false);
      setEditingTrainer(null);
    }
  };

  const handleDeleteTrainer = (trainer: Trainer) => {
    setDeletingTrainer(trainer);
  };

  const confirmDeleteTrainer = async () => {
    if (deletingTrainer) {
      const success = await deleteTrainer(deletingTrainer.id);
      if (success) {
        setDeletingTrainer(null);
      }
    }
  };

  const cancelDeleteTrainer = () => {
    setDeletingTrainer(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTrainer(null);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Loading trainers...</p>
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
              All Trainers ({trainers.length})
            </CardTitle>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
            >
              Add Trainer
            </Button>
          </div>

          <TrainersList
            trainers={trainers}
            onEdit={handleEditTrainer}
            onDelete={handleDeleteTrainer}
          />
        </CardBody>
      </Card>

      <AddTrainerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleAddTrainer}
        onUpdate={handleUpdateTrainer}
        editingTrainer={editingTrainer}
      />

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