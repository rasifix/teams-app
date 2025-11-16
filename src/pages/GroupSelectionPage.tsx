import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useGroups, useGroupsLoading, useGroupsError } from '../store/useStore';

export default function GroupSelectionPage() {
  const navigate = useNavigate();
  const { loadGroups, selectGroup } = useStore();
  const groups = useGroups();
  const loading = useGroupsLoading();
  const error = useGroupsError();

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleGroupSelect = async (groupId: string) => {
    await selectGroup(groupId);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Groups...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Groups</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Your Group</h1>
          <p className="text-gray-600">Choose the group you want to work with</p>
        </div>

        <div className="space-y-3">
          {groups?.map((group) => (
            <button
              key={group.id}
              onClick={() => handleGroupSelect(group.id)}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">ID: {group.id}</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {(!groups || groups.length === 0) && (
          <div className="text-center text-gray-500 mt-8">
            <p>No groups available</p>
          </div>
        )}
      </div>
    </div>
  );
}