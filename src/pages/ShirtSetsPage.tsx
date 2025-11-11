import { useState } from "react";
import { useShirtSets } from "../hooks/useShirtSets";
import { Card, CardBody, CardTitle } from "../components/ui";
import Button from "../components/ui/Button";
import AddShirtSetModal from "../components/AddShirtSetModal";
import EditShirtSetModal from "../components/EditShirtSetModal";
import AddShirtModal from "../components/AddShirtModal";
import EditShirtModal from "../components/EditShirtModal";
import ConfirmDialog from "../components/ConfirmDialog";
import ShirtSetCard from "../components/ShirtSetCard";
import type { ShirtSet, Shirt } from "../types";

export default function ShirtSetsPage() {
  const {
    shirtSets,
    loading,
    error,
    addShirtSet,
    updateShirtSet,
    deleteShirtSet,
    addShirtToSet,
    removeShirtFromSet,
    updateShirt,
  } = useShirtSets();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShirtSet, setEditingShirtSet] = useState<ShirtSet | null>(null);
  const [deletingShirtSet, setDeletingShirtSet] = useState<ShirtSet | null>(null);
  const [deletingShirt, setDeletingShirt] = useState<{shirtSetId: string, shirtId: string, shirtNumber: number} | null>(null);
  const [editingShirt, setEditingShirt] = useState<{shirtSetId: string, shirt: Shirt} | null>(null);
  const [addingShirtToSet, setAddingShirtToSet] = useState<string | null>(null);
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());

  const handleAddShirtSet = async (shirtSetData: Omit<ShirtSet, 'id'>) => {
    const success = await addShirtSet(shirtSetData);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleUpdateShirtSet = async (id: string, updates: Partial<Omit<ShirtSet, 'id'>>) => {
    const success = await updateShirtSet(id, updates);
    if (success) {
      setEditingShirtSet(null);
    }
  };

  const handleDeleteShirtSet = async () => {
    if (deletingShirtSet) {
      const success = await deleteShirtSet(deletingShirtSet.id);
      if (success) {
        setDeletingShirtSet(null);
      }
    }
  };

  const handleEditShirt = (shirtSetId: string, updatedShirt: Shirt) => {
    updateShirt(shirtSetId, updatedShirt);
    setEditingShirt(null);
  };

  const toggleExpanded = (setId: string) => {
    const newExpandedSets = new Set(expandedSets);
    if (newExpandedSets.has(setId)) {
      newExpandedSets.delete(setId);
    } else {
      newExpandedSets.add(setId);
    }
    setExpandedSets(newExpandedSets);
  };

  const handleAddShirt = async (shirtSetId: string, shirtData: Omit<Shirt, 'id'>) => {
    const success = await addShirtToSet(shirtSetId, shirtData);
    if (success) {
      setAddingShirtToSet(null);
    }
  };

  const handleRemoveShirt = async (shirtSetId: string, shirtId: string, shirtNumber: number) => {
    setDeletingShirt({ shirtSetId, shirtId, shirtNumber });
  };

  const confirmRemoveShirt = async () => {
    if (deletingShirt) {
      await removeShirtFromSet(deletingShirt.shirtSetId, deletingShirt.shirtNumber);
      setDeletingShirt(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Loading shirts...</p>
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
              Shirts ({shirtSets.length})
            </CardTitle>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add
            </Button>
          </div>

          {shirtSets.length === 0 ? (
            <div className="empty-state">
              <p>No shirts yet. Create your first shirt set to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shirtSets.map((shirtSet) => (
                <ShirtSetCard
                  key={shirtSet.id}
                  shirtSet={shirtSet}
                  isExpanded={expandedSets.has(shirtSet.id)}
                  onToggleExpanded={() => toggleExpanded(shirtSet.id)}
                  onEdit={() => setEditingShirtSet(shirtSet)}
                  onDelete={() => setDeletingShirtSet(shirtSet)}
                  onAddShirt={() => setAddingShirtToSet(shirtSet.id)}
                  onEditShirt={(shirt) => setEditingShirt({ shirtSetId: shirtSet.id, shirt })}
                  onRemoveShirt={(shirtId, shirtNumber) => handleRemoveShirt(shirtSet.id, shirtId, shirtNumber)}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Shirt Set Modal */}
      {isAddModalOpen && (
        <AddShirtSetModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddShirtSet}
        />
      )}

      {/* Edit Shirt Set Modal */}
      {editingShirtSet && (
        <EditShirtSetModal
          shirtSet={editingShirtSet}
          onClose={() => setEditingShirtSet(null)}
          onSubmit={(updates: Partial<Omit<ShirtSet, 'id'>>) => handleUpdateShirtSet(editingShirtSet.id, updates)}
        />
      )}

      {/* Add Shirt Modal */}
      {addingShirtToSet && (
        <AddShirtModal
          onClose={() => setAddingShirtToSet(null)}
          onSubmit={(shirtData) => handleAddShirt(addingShirtToSet, shirtData)}
          existingNumbers={shirtSets.find(set => set.id === addingShirtToSet)?.shirts.map(shirt => shirt.number) || []}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingShirtSet && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Shirt Set"
          message={`Are you sure you want to delete the shirt set "${deletingShirtSet.sponsor} - ${deletingShirtSet.color}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDeleteShirtSet}
          onCancel={() => setDeletingShirtSet(null)}
        />
      )}

      {/* Delete Shirt Confirmation Dialog */}
      {deletingShirt && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Shirt"
          message={`Are you sure you want to remove shirt #${deletingShirt.shirtNumber} from this set? This action cannot be undone.`}
          confirmText="Remove"
          onConfirm={confirmRemoveShirt}
          onCancel={() => setDeletingShirt(null)}
        />
      )}

      {/* Edit Shirt Modal */}
      {editingShirt && (
        <EditShirtModal
          isOpen={true}
          onClose={() => setEditingShirt(null)}
          onSave={(updatedShirt) => handleEditShirt(editingShirt.shirtSetId, updatedShirt)}
          shirt={editingShirt.shirt}
          existingNumbers={shirtSets.find(set => set.id === editingShirt.shirtSetId)?.shirts
            .filter(s => s.number !== editingShirt.shirt.number)
            .map(shirt => shirt.number) || []}
        />
      )}
    </div>
  );
}