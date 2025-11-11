import { useState } from 'react';
import type { ShirtSet, Shirt } from '../types';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface AddShirtSetModalProps {
  onClose: () => void;
  onSubmit: (shirtSetData: Omit<ShirtSet, 'id'>) => void;
}

export default function AddShirtSetModal({ onClose, onSubmit }: AddShirtSetModalProps) {
  const [formData, setFormData] = useState({
    sponsor: '',
    color: '#000000', // Default color
    shirts: []
  });

  const [shirtOptions, setShirtOptions] = useState({
    createShirts: false,
    startNumber: 1,
    endNumber: 11,
    size: 'M' as '128' | '140' | '152' | '164' | 'XS' | 'S' | 'M' | 'L' | 'XL',
    includeGoalkeeper: false,
    goalkeeperNumber: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sponsor.trim() && formData.color.trim()) {
      const shirts: Shirt[] = [];
      
      // Create shirts based on options
      if (shirtOptions.createShirts) {
        // Create regular shirts in the range
        for (let num = shirtOptions.startNumber; num <= shirtOptions.endNumber; num++) {
          // Skip goalkeeper number if creating separate goalkeeper shirt
          if (shirtOptions.includeGoalkeeper && num === shirtOptions.goalkeeperNumber) {
            continue;
          }
          
          shirts.push({
            number: num,
            size: shirtOptions.size,
            isGoalkeeper: false
          });
        }
        
        // Add goalkeeper shirt if requested
        if (shirtOptions.includeGoalkeeper) {
          shirts.push({
            number: shirtOptions.goalkeeperNumber,
            size: shirtOptions.size,
            isGoalkeeper: true
          });
        }
      }
      
      onSubmit({
        sponsor: formData.sponsor.trim(),
        color: formData.color,
        shirts: shirts
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShirtOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setShirtOptions(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Add New Shirt Set</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-3">
            <div>
              <label htmlFor="sponsor" className="block text-sm font-medium text-gray-700 mb-1">
                Sponsor Name *
              </label>
              <input
                id="sponsor"
                name="sponsor"
                type="text"
                required
                value={formData.sponsor}
                onChange={handleInputChange}
                placeholder="Enter sponsor name"
                className="input-field w-full"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="color"
                  name="color"
                  type="color"
                  required
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={handleInputChange}
                  name="color"
                  placeholder="#000000"
                  className="input-field flex-1"
                />
              </div>
            </div>

            {/* Shirt creation options */}
            <div className="border-t pt-3">
              <div className="flex items-center mb-3">
                <input
                  id="createShirts"
                  name="createShirts"
                  type="checkbox"
                  checked={shirtOptions.createShirts}
                  onChange={handleShirtOptionChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="createShirts" className="ml-2 text-sm font-medium text-gray-700">
                  Create shirts automatically
                </label>
              </div>

              {shirtOptions.createShirts && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="startNumber" className="block text-xs font-medium text-gray-700 mb-1">
                        Start #
                      </label>
                      <input
                        id="startNumber"
                        name="startNumber"
                        type="number"
                        min="1"
                        max="99"
                        value={shirtOptions.startNumber}
                        onChange={handleShirtOptionChange}
                        className="input-field w-full text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="endNumber" className="block text-xs font-medium text-gray-700 mb-1">
                        End #
                      </label>
                      <input
                        id="endNumber"
                        name="endNumber"
                        type="number"
                        min="1"
                        max="99"
                        value={shirtOptions.endNumber}
                        onChange={handleShirtOptionChange}
                        className="input-field w-full text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="size" className="block text-xs font-medium text-gray-700 mb-1">
                        Size
                      </label>
                      <select
                        id="size"
                        name="size"
                        value={shirtOptions.size}
                        onChange={handleShirtOptionChange}
                        className="input-field w-full text-sm"
                      >
                        <option value="128">128</option>
                        <option value="140">140</option>
                        <option value="152">152</option>
                        <option value="164">164</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="includeGoalkeeper"
                        name="includeGoalkeeper"
                        type="checkbox"
                        checked={shirtOptions.includeGoalkeeper}
                        onChange={handleShirtOptionChange}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="includeGoalkeeper" className="ml-2 text-sm text-gray-700">
                        Include GK
                      </label>
                    </div>
                    
                    {shirtOptions.includeGoalkeeper && (
                      <div className="flex items-center gap-2">
                        <label htmlFor="goalkeeperNumber" className="text-xs text-gray-700">
                          GK #:
                        </label>
                        <input
                          id="goalkeeperNumber"
                          name="goalkeeperNumber"
                          type="number"
                          min="1"
                          max="99"
                          value={shirtOptions.goalkeeperNumber}
                          onChange={handleShirtOptionChange}
                          className="input-field w-16 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    Will create {
                      Math.max(0, shirtOptions.endNumber - shirtOptions.startNumber + 1 - 
                        (shirtOptions.includeGoalkeeper && 
                         shirtOptions.goalkeeperNumber >= shirtOptions.startNumber && 
                         shirtOptions.goalkeeperNumber <= shirtOptions.endNumber ? 1 : 0))
                    } regular{shirtOptions.includeGoalkeeper ? ' + 1 GK' : ''} shirt{(Math.max(0, shirtOptions.endNumber - shirtOptions.startNumber + 1) + (shirtOptions.includeGoalkeeper ? 1 : 0)) !== 1 ? 's' : ''} (size {shirtOptions.size})
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Shirt Set
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
