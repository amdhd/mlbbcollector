import React from 'react';

export type TabId = 'profile' | 'collection' | 'rankings';

interface TabNavigationProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onChange }) => {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'collection', label: 'Collection' },
    { id: 'rankings', label: 'Rankings' }
  ];
  
  return (
    <div className="flex border-b border-gray-700 mb-3">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`py-2 px-3 font-medium text-xs sm:text-sm focus:outline-none transition-colors ${
            activeTab === tab.id
              ? 'text-orange-400 border-b-2 border-orange-400 bg-gray-800'
              : 'text-gray-300 hover:text-orange-300 hover:bg-gray-800'
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation; 