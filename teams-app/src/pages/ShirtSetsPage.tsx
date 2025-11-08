import { useState } from "react";
import { useShirtSets } from "../hooks/useShirtSets";
import { Card, CardBody, CardTitle } from "../components/ui";
import Button from "../components/ui/Button";
import AddShirtSetModal from "../components/AddShirtSetModal";
import EditShirtSetModal from "../components/EditShirtSetModal";
import AddShirtModal from "../components/AddShirtModal";
import EditShirtModal from "../components/EditShirtModal";
import ConfirmDialog from "../components/ConfirmDialog";
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
      await removeShirtFromSet(deletingShirt.shirtSetId, deletingShirt.shirtId);
      setDeletingShirt(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Loading shirt sets...</p>
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
              Shirt Sets ({shirtSets.length})
            </CardTitle>
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Shirt Set
            </Button>
          </div>

          {shirtSets.length === 0 ? (
            <div className="empty-state">
              <p>No shirt sets yet. Create your first shirt set to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shirtSets.map((shirtSet) => (
                <div key={shirtSet.id} className={`border-l-4 card`} style={{ borderLeftColor: shirtSet.color }}>
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div 
                          className="flex items-center justify-between mb-2 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                          onClick={() => toggleExpanded(shirtSet.id)}
                        >
                          <div className="flex items-center gap-3">
                            <svg 
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                expandedSets.has(shirtSet.id) ? 'rotate-90' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            <h3 className="text-lg font-semibold">{shirtSet.sponsor}</h3>
                            <div 
                              className="w-6 h-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: shirtSet.color }}
                              title={shirtSet.color}
                            />
                            <span className="text-sm text-gray-500">
                              {shirtSet.shirts.length} shirt{shirtSet.shirts.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingShirtSet(shirtSet)}
                            >
                              Edit Set
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setDeletingShirtSet(shirtSet)}
                            >
                              Delete Set
                            </Button>
                          </div>
                        </div>

                        {expandedSets.has(shirtSet.id) && (
                          <div className="mt-4">
                            <div className="mb-3">
                              <h4 className="font-medium">Shirts in this set:</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                              {shirtSet.shirts
                                .sort((a, b) => a.number - b.number)
                                .map((shirt) => (
                                    <div 
                                      key={shirt.id} 
                                      className={`flex items-center justify-between p-2 rounded border h-11 ${
                                        shirt.isGoalkeeper ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">#{shirt.number}</span>
                                        <span className="text-sm text-gray-600">{shirt.size}</span>
                                        {shirt.isGoalkeeper && (
                                          <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-1 py-0.5 rounded">GK</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => setEditingShirt({ shirtSetId: shirtSet.id, shirt })}
                                          className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                                          title="Edit shirt"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleRemoveShirt(shirtSet.id, shirt.id, shirt.number)}
                                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                                          title="Remove shirt"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                              
                              {/* Add Shirt Card */}
                              <div 
                                onClick={() => setAddingShirtToSet(shirtSet.id)}
                                className="flex items-center justify-center p-2 rounded border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 group h-11"
                              >
                                <svg 
                                  className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
            .filter(s => s.id !== editingShirt.shirt.id)
            .map(shirt => shirt.number) || []}
        />
      )}
    </div>
  );
}