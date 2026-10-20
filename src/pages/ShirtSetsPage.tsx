import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useShirtSets } from "../hooks/useShirtSets";
import { AddCardButton, Alert, EmptyState, Page, PageDescription, PageHeader, PageHeaderContent, PageTitle, ShirtIcon, Stack } from "../components/ui";
import AddShirtSetModal from "../components/AddShirtSetModal";
import EditShirtSetModal from "../components/EditShirtSetModal";
import AddShirtModal from "../components/AddShirtModal";
import EditShirtModal from "../components/EditShirtModal";
import ConfirmDialog from "../components/ConfirmDialog";
import ShirtSetCard from "../components/ShirtSetCard";
import type { ShirtSet, Shirt } from "../types";
import { selectShirtNumbersForSet } from '../store/selectors/shirtSetSelectors';

export default function ShirtSetsPage() {
  const { t } = useTranslation();
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
      <Page>
        <EmptyState>
          <p>{t('shirts.loading')}</p>
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>{t('shirts.titleWithCount', { count: shirtSets.length })}</PageTitle>
          <PageDescription>{t('shirts.subtitle')}</PageDescription>
        </PageHeaderContent>
      </PageHeader>

      {error && (
        <Alert>
          {error}
        </Alert>
      )}

      <Stack gap="sm">
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
        <AddCardButton cardSize="md" leading={<ShirtIcon className="icon-sm" />} onClick={() => setIsAddModalOpen(true)} label={t('shirtSetModal.addTitle')} />
      </Stack>

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
          existingNumbers={selectShirtNumbersForSet(shirtSets, addingShirtToSet)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingShirtSet && (
        <ConfirmDialog
          isOpen={true}
          title={t('shirts.deleteSetTitle')}
          message={t('shirts.deleteSetMessage', { sponsor: deletingShirtSet.sponsor, color: deletingShirtSet.color })}
          confirmText={t('common.actions.delete')}
          onConfirm={handleDeleteShirtSet}
          onCancel={() => setDeletingShirtSet(null)}
        />
      )}

      {/* Delete Shirt Confirmation Dialog */}
      {deletingShirt && (
        <ConfirmDialog
          isOpen={true}
          title={t('shirts.removeShirtTitle')}
          message={t('shirts.removeShirtMessage', { number: deletingShirt.shirtNumber })}
          confirmText={t('shirts.removeShirtAction')}
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
          existingNumbers={selectShirtNumbersForSet(shirtSets, editingShirt.shirtSetId, editingShirt.shirt.number)}
        />
      )}
    </Page>
  );
}
