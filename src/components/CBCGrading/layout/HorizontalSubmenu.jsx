import React, { useMemo } from 'react';
import { useNavigation } from '../hooks/useNavigation';

const flattenLeafItems = (items = []) =>
  items.flatMap((item) => (item.type === 'group' ? (item.items || []) : [item]));

const HorizontalSubmenu = ({ currentPage, onNavigate }) => {
  const { navSections } = useNavigation();

  const activeSection = useMemo(() => {
    const sectionByPage = (navSections || []).find((section) => {
      const leaves = flattenLeafItems(section.items || []);
      return leaves.some((leaf) => leaf.path === currentPage);
    });
    if (sectionByPage) return sectionByPage;
    return (navSections || []).find((section) => section.id === currentPage) || null;
  }, [navSections, currentPage]);

  const items = useMemo(
    () => flattenLeafItems(activeSection?.items || []).filter((item) => !item.greyedOut),
    [activeSection]
  );

  if (!activeSection || items.length === 0) return null;

  return (
    <div className="border-b border-gray-200 bg-white/95 backdrop-blur-sm px-6">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-3 overflow-x-auto custom-scrollbar whitespace-nowrap py-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          {activeSection.label}
        </span>
        <span className="h-4 w-px bg-gray-300" />
        {items.map((item, idx) => {
          const isActive = currentPage === item.path;
          return (
            <React.Fragment key={item.id || item.path || idx}>
              <button
                type="button"
                onClick={() => !item.comingSoon && onNavigate(item.path)}
                disabled={!!item.comingSoon}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-md transition ${
                  isActive
                    ? 'text-indigo-700 bg-indigo-50'
                    : item.comingSoon
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:text-indigo-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
              {idx < items.length - 1 && <span className="h-4 w-px bg-gray-300" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalSubmenu;

