/**
 * Sidebar Component
 * Navigation sidebar with collapsible sections
 * Role-based permission filtering - Tutors hidden from teachers
 * Focus mode: Only showing Students, Tutors, Parents, Assessment, and Settings
 */

import React, { useMemo, useState } from 'react';
import {
  Menu, X, ChevronDown, School, Boxes, ExternalLink, Pin
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigation, allNavSections } from '../hooks/useNavigation';

const prefetchModule = (path) => {
  // Disabled under Vite: 
  // Vite handles module preloading natively via <link rel="modulepreload">. 
  // Manual dynamic imports with variable deep paths (like "reports/Summary") crash Rollup's static analyzer.
  return;
};

// Helper to find the first navigable path in a section
const findDefaultPath = (items) => {
  for (const item of items) {
    if (item.type === 'group') {
      const path = findDefaultPath(item.items);
      if (path) return path;
    } else {
      if (!item.greyedOut && item.path) {
        return item.path;
      }
    }
  }
  return null;
};

const Sidebar = React.memo(({
  sidebarOpen,
  setSidebarOpen,
  currentPage,
  onNavigate,
  expandedSections,
  toggleSection,
  brandingSettings
}) => {
  const { can, role } = usePermissions();
  const [hoveredSection, setHoveredSection] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ left: 0 });
  const [isPinned, setIsPinned] = useState(false);
  const [expandedSubSections, setExpandedSubSections] = useState({
    'group-summative': true,
    'group-formative': false,
    'group-general':   true
  });
  const hoverTimeoutRef = React.useRef(null);

  const handleMouseEnter = (e, section) => {
    if (sidebarOpen || section.items.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    // Only store left — flyout will be pinned top-to-bottom via CSS
    setHoverPosition({ left: rect.right + 8 });
    setHoveredSection(section);
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSection(null);
    }, 200);
  };

  const toggleSubSection = (id) => {
    setExpandedSubSections(prev => {
      const isOpening = !prev[id];
      if (isOpening) {
        const newState = Object.keys(prev).reduce((acc, key) => { acc[key] = false; return acc; }, {});
        newState[id] = true;
        return newState;
      }
      return { ...prev, [id]: false };
    });
  };

  // Auto-expand group when one of its children is the active page
  React.useEffect(() => {
    allNavSections.forEach(section => {
      if (section.items && section.items.length > 0) {
        section.items.forEach(item => {
          if (item.type === 'group') {
            const isChildActive = item.items.some(subItem => subItem.path === currentPage);
            if (isChildActive) {
              setExpandedSubSections(prev => ({ ...prev, [item.id]: true }));
            }
          }
        });
      }
    });
  }, [currentPage]);

  const {
    navSections,
    dashboardSection,
    communicationSection,
    schoolSections,
    lmsSection,
    studentLmsSection,
    backOfficeSections,
    docsCenterSection,
    systemAdminSections
  } = useNavigation();

  const handleSectionClick = (section) => {
    if (sidebarOpen) {
      toggleSection(section.id);
    } else {
      const defaultPath = findDefaultPath(section.items);
      if (defaultPath) {
        onNavigate(defaultPath);
      } else {
        setSidebarOpen(true);
        toggleSection(section.id);
      }
    }
  };

  const [activeCategory, setActiveCategory] = useState(() => {
    const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
    const schoolRoles = ['ACCOUNTANT', 'RECEPTIONIST', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM'];
    if (adminRoles.includes(role)) return 'school';
    if (schoolRoles.includes(role)) return 'backOffice';
    return 'school';
  });

  const toggleCategory = (category) => {
    setActiveCategory(prev => prev === category ? null : category);
  };

  React.useEffect(() => {
    const isSchool = schoolSections.some(s => s.id === currentPage || s.items.some(i => i.path === currentPage));
    const isBackOffice = backOfficeSections.some(s => s.id === currentPage || s.items.some(i => i.path === currentPage));
    const isAdmin = systemAdminSections.some(s => s.id === currentPage || s.items.some(i => i.path === currentPage));

    if (isSchool) setActiveCategory('school');
    else if (isBackOffice) setActiveCategory('backOffice');
    else if (isAdmin) setActiveCategory('admin');
  }, [currentPage, schoolSections, backOfficeSections, systemAdminSections]);

  return (
    <div className={`${sidebarOpen ? 'w-52' : 'w-20'} bg-[var(--brand-purple)] text-white transition-all duration-300 flex flex-col border-r border-white/10 shadow-lg`}>
      {/* Logo/Brand */}
      <div className="h-20 p-5 border-b border-white/10 bg-[var(--brand-purple-dark)] relative overflow-hidden">
        <div className="flex items-center gap-3 justify-center overflow-hidden relative z-10">
          {brandingSettings?.logoUrl ? (
            <div className={`transition-all duration-300 flex items-center justify-center ${sidebarOpen ? 'w-full px-2' : 'w-10 h-10'}`}>
              <img 
                src={brandingSettings.logoUrl} 
                alt="School Logo" 
                className={`${sidebarOpen ? 'h-12 object-contain' : 'w-full h-full object-cover rounded-lg shadow-sm'}`} 
              />
            </div>
          ) : sidebarOpen ? (
            <h1 className="text-xl font-bold text-white tracking-widest truncate w-full text-center hover:drop-shadow-lg transition-shadow duration-300">
              {brandingSettings?.schoolName || 'ZAWADI JUNIOR ACADEMY'}
            </h1>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0 border border-white/10 hover:border-brand-purple/50 transition-all duration-300 shadow-lg">
              <span className="text-lg font-bold text-white">
                {(brandingSettings?.schoolName || 'EL').substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 bg-[var(--brand-purple)] custom-scrollbar space-y-2">
        <div className="space-y-3">

          {/* Dashboard */}
          {dashboardSection && (
            <button
              onClick={() => onNavigate(dashboardSection.id)}
              onMouseEnter={() => prefetchModule(dashboardSection.id)}
              className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                currentPage === dashboardSection.id
                  ? 'bg-brand-teal/40 text-white border border-brand-teal/50 shadow-lg shadow-brand-teal/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
              }`}
            >
              <div className="min-w-[20px] flex justify-center relative z-10 group-hover:scale-110 transition-transform duration-300">
                <dashboardSection.icon size={20} />
              </div>
              {sidebarOpen && <span className="text-left text-sm font-bold tracking-tight relative z-10">{dashboardSection.label}</span>}
            </button>
          )}

          {/* Communications / Inbox */}
          {communicationSection && (
            <NavSection
              section={communicationSection}
              expandedSections={expandedSections}
              handleSectionClick={handleSectionClick}
              sidebarOpen={sidebarOpen}
              expandedSubSections={expandedSubSections}
              toggleSubSection={toggleSubSection}
              currentPage={currentPage}
              onNavigate={onNavigate}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          )}

          {/* School Operations */}
          {schoolSections.length > 0 && (
            <div className="space-y-1">
              {sidebarOpen && (
                <button
                  onClick={() => toggleCategory('school')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-200 transition-all duration-300 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-[20px] flex justify-center">
                      <School size={18} className="opacity-70" />
                    </div>
                    <span className="uppercase tracking-wider font-bold text-brand-teal">School</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeCategory === 'school' ? 'rotate-180' : ''}`} />
                </button>
              )}
              {(!sidebarOpen || activeCategory === 'school') && (
                <div className={sidebarOpen ? 'animate-in fade-in slide-in-from-top-1 duration-200' : ''}>
                  {schoolSections.map(section => (
                    <NavSection
                      key={section.id}
                      section={section}
                      expandedSections={expandedSections}
                      handleSectionClick={handleSectionClick}
                      sidebarOpen={sidebarOpen}
                      expandedSubSections={expandedSubSections}
                      toggleSubSection={toggleSubSection}
                      currentPage={currentPage}
                      onNavigate={onNavigate}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LMS — Standalone module, above Back Office */}
          {lmsSection && (
            <NavSection
              section={lmsSection}
              expandedSections={expandedSections}
              handleSectionClick={handleSectionClick}
              sidebarOpen={sidebarOpen}
              expandedSubSections={expandedSubSections}
              toggleSubSection={toggleSubSection}
              currentPage={currentPage}
              onNavigate={onNavigate}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          )}

          {/* Student Portal — shown only when studentLmsSection is available (STUDENT role) */}
          {studentLmsSection && (
            <NavSection
              section={studentLmsSection}
              expandedSections={expandedSections}
              handleSectionClick={handleSectionClick}
              sidebarOpen={sidebarOpen}
              expandedSubSections={expandedSubSections}
              toggleSubSection={toggleSubSection}
              currentPage={currentPage}
              onNavigate={onNavigate}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          )}

          {/* Back Office */}
          {backOfficeSections.length > 0 && (
            <div className="space-y-1">
              {sidebarOpen && (
                <button
                  onClick={() => toggleCategory('backOffice')}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-200 transition-all duration-300 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-[20px] flex justify-center">
                      <Boxes size={18} className="opacity-70" />
                    </div>
                    <span className="uppercase tracking-wider font-bold text-brand-teal">Back Office</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeCategory === 'backOffice' ? 'rotate-180' : ''}`} />
                </button>
              )}
              {(!sidebarOpen || activeCategory === 'backOffice') && (
                <div className={sidebarOpen ? 'animate-in fade-in slide-in-from-top-1 duration-200' : ''}>
                  {backOfficeSections.map(section => (
                    <NavSection
                      key={section.id}
                      section={section}
                      expandedSections={expandedSections}
                      handleSectionClick={handleSectionClick}
                      sidebarOpen={sidebarOpen}
                      expandedSubSections={expandedSubSections}
                      toggleSubSection={toggleSubSection}
                      currentPage={currentPage}
                      onNavigate={onNavigate}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Standalone */}
          {docsCenterSection && (
            <NavSection
              section={docsCenterSection}
              expandedSections={expandedSections}
              handleSectionClick={handleSectionClick}
              sidebarOpen={sidebarOpen}
              expandedSubSections={expandedSubSections}
              toggleSubSection={toggleSubSection}
              currentPage={currentPage}
              onNavigate={onNavigate}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          )}
        </div>
      </nav>

      {/* System Admin */}
      <div className="p-3 border-t border-white/10 bg-[var(--brand-purple-dark)]">
        {systemAdminSections.length > 0 && (
          <div className="space-y-1 mb-2">
            {sidebarOpen && (
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                System Admin
              </div>
            )}
            {systemAdminSections.map(section => (
              <NavSection
                key={section.id}
                section={section}
                expandedSections={expandedSections}
                handleSectionClick={handleSectionClick}
                sidebarOpen={sidebarOpen}
                expandedSubSections={expandedSubSections}
                toggleSubSection={toggleSubSection}
                currentPage={currentPage}
                onNavigate={onNavigate}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                isBottom={true}
              />
            ))}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition text-gray-400 hover:bg-[#0D9488] hover:text-white"
        >
          {sidebarOpen ? (
            <>
              <X size={20} />
              <span className="text-sm font-medium">Collapse Menu</span>
            </>
          ) : (
            <Menu size={20} />
          )}
        </button>
      </div>

      {/* Flyout Menu (Portal) — full viewport height, pinned to sidebar right edge */}
      {!sidebarOpen && hoveredSection && createPortal(
        <div 
          className="fixed z-[9999] bg-[#0c0516]/95 backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5),0_0_20px_rgba(13,148,136,0.1)] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-left-2 duration-150"
          style={{ 
            top: 0,
            bottom: 0,
            left: hoverPosition.left,
            minWidth: '240px',
            overflowY: 'auto'
          }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Flyout Header */}
          <div className="px-5 py-4 bg-[var(--brand-purple-dark)] border-b border-white/10 flex items-center justify-between sticky top-0 z-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">Explore Section</span>
              <span className="text-sm font-bold text-white">
                {hoveredSection.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsPinned(!isPinned)}
                className={`p-2 rounded-lg transition-all active:scale-90 ${isPinned ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                title={isPinned ? "Unpin menu" : "Pin menu to keep it open"}
              >
                <Pin size={18} className={isPinned ? 'fill-current' : ''} />
              </button>
              <div className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center border border-brand-teal/20 text-brand-teal">
                <hoveredSection.icon size={20} />
              </div>
            </div>
          </div>

          {/* Flyout Items */}
          <div className="p-3 space-y-1.5 bg-[#0c0516]">
            {hoveredSection.items.map(section => {
              if (section.type === 'group') {
                return (
                  <div key={section.id} className="mb-4 first:mt-1">
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#0D9488] mb-1 flex items-center gap-2 bg-white/5 rounded-md border border-white/5">
                      {section.icon && <section.icon size={12} />}
                      {section.label}
                    </div>
                    <div className="space-y-1 ml-2 border-l-2 border-[#0D9488]/30">
                      {section.items.map(subItem => (
                        <FlyoutItem 
                          key={subItem.id} 
                          item={subItem} 
                          currentPage={currentPage} 
                          onNavigate={(path) => {
                            onNavigate(path);
                            setHoveredSection(null);
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <FlyoutItem 
                  key={section.id} 
                  item={section} 
                  currentPage={currentPage} 
                  onNavigate={(path) => {
                    onNavigate(path);
                    setHoveredSection(null);
                  }} 
                />
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

// ─── NavSection ──────────────────────────────────────────────────────────────
const NavSection = React.memo(({
  section,
  expandedSections,
  handleSectionClick,
  sidebarOpen,
  expandedSubSections,
  toggleSubSection,
  currentPage,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
  isBottom = false
}) => {
  return (
    <div 
      key={section.id}
      onMouseEnter={(e) => onMouseEnter?.(e, section)}
      onMouseLeave={onMouseLeave}
    >
      {section.items.length > 0 ? (
        <>
          <button
            onClick={() => handleSectionClick(section)}
            onMouseEnter={() => {
              if (!sidebarOpen) {
                const defaultPath = findDefaultPath(section.items);
                if (defaultPath) prefetchModule(defaultPath);
              }
            }}
            className={`w-full text-left flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
              section.id === 'assessment'
                ? (expandedSections[section.id]
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'text-amber-400 hover:bg-white/5 hover:text-amber-300 border border-transparent hover:border-amber-500/30')
                : (expandedSections[section.id]
                    ? 'bg-white/10 text-white border border-white/20 shadow-lg shadow-white/5'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10')
            }`}
          >
            <div className="flex items-center gap-3 flex-1 relative z-10 justify-start">
              <div className="min-w-[20px] flex justify-center group-hover:scale-110 transition-transform duration-300">
                <section.icon size={20} className={section.id === 'assessment' ? 'text-amber-400' : ''} />
              </div>
              {sidebarOpen && <span className="text-left text-sm font-bold tracking-tight">{section.label}</span>}
            </div>
            {sidebarOpen && (
              <ChevronDown
                size={16}
                className={`transition duration-300 ${expandedSections[section.id] ? 'rotate-180' : ''} opacity-70 group-hover:opacity-100`}
              />
            )}
          </button>

          {expandedSections[section.id] && sidebarOpen && (
            <div className={`ml-6 space-y-0.5 mt-1 border-l border-white/10 ${isBottom ? 'mb-2' : ''}`}>
              {section.items.map((item) => {
                if (item.type === 'group') {
                  const isGroupActive = item.items.some(subItem => subItem.path === currentPage);
                  return (
                    <div key={item.id} className="mt-2 mb-1">
                      <button
                        onClick={() => item.greyedOut ? null : toggleSubSection(item.id)}
                        disabled={item.greyedOut}
                        className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm font-semibold transition-colors ${
                          item.greyedOut
                            ? 'text-gray-600 opacity-50 cursor-not-allowed'
                            : (isGroupActive
                                ? 'text-white bg-white/10 rounded-md'
                                : 'text-teal-200 hover:text-white')
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon && (
                            <item.icon size={12} className={item.greyedOut ? 'opacity-40' : (isGroupActive ? 'text-[#0D9488]' : 'opacity-70')} />
                          )}
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown size={10} className={`transition-transform duration-200 opacity-50 ${expandedSubSections[item.id] ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedSubSections[item.id] && (
                        <div className="space-y-0.5 ml-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          {item.items.map(subItem => (
                            <button
                              key={subItem.id}
                              onClick={() => subItem.greyedOut ? null : onNavigate(subItem.path)}
                              onMouseEnter={() => prefetchModule(subItem.path)}
                              disabled={subItem.greyedOut}
                              className={`w-full text-left px-3 py-1.5 rounded-r-md text-xs transition flex items-center justify-between ${
                                subItem.comingSoon || subItem.greyedOut
                                  ? 'text-gray-600 cursor-not-allowed'
                                  : (currentPage === subItem.path
                                      ? 'bg-white/5 text-white font-medium border-l-2 border-white'
                                      : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-2 border-transparent')
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-gray-500 flex-shrink-0">—</span>
                                <span className="truncate">{subItem.label}</span>
                              </div>
                              {subItem.comingSoon && (
                                <span className="text-[8px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-medium uppercase border border-[#F59E0B]/30 flex-shrink-0">
                                  Soon
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => item.greyedOut ? null : onNavigate(item.path)}
                    onMouseEnter={() => prefetchModule(item.path)}
                    disabled={item.greyedOut}
                    className={`w-full text-left px-3 py-1.5 rounded-r-md text-sm transition flex items-center justify-between ${
                      item.comingSoon || item.greyedOut
                        ? 'text-gray-600 cursor-not-allowed'
                        : (currentPage === item.path
                            ? 'bg-white/5 text-white font-medium border-l-2 border-white'
                            : 'text-teal-200 hover:text-white hover:bg-white/5 border-l-2 border-transparent')
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.comingSoon && (
                      <span className="text-[8px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-medium uppercase border border-[#F59E0B]/30">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <button
          onClick={() => section.greyedOut ? null : onNavigate(section.id)}
          onMouseEnter={() => prefetchModule(section.id)}
          disabled={section.greyedOut}
          className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${
            section.comingSoon || section.greyedOut
              ? 'text-gray-500 opacity-50 cursor-not-allowed border border-dashed border-white/5'
              : (currentPage === section.id
                  ? 'bg-white/5 text-[#0D9488] border-l-4 border-[#0D9488]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent')
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="min-w-[20px] flex justify-center">
              <section.icon size={18} />
            </div>
            {sidebarOpen && <span className="text-sm font-medium">{section.label}</span>}
          </div>
          {sidebarOpen && section.comingSoon && (
            <span className="text-[8px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-medium uppercase border border-[#F59E0B]/30">
              Soon
            </span>
          )}
        </button>
      )}
    </div>
  );
});

NavSection.displayName = 'NavSection';
Sidebar.displayName = 'Sidebar';

const FlyoutItem = ({ item, currentPage, onNavigate }) => (
  <button
    onClick={() => item.greyedOut ? null : onNavigate(item.path)}
    disabled={item.greyedOut}
    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all flex items-center justify-between ${
      item.greyedOut
        ? 'text-gray-600 opacity-50 cursor-not-allowed'
        : (currentPage === item.path
            ? 'bg-brand-teal/20 text-white font-bold border border-brand-teal/30 shadow-lg shadow-brand-teal/10'
            : 'text-gray-300 hover:text-white hover:bg-white/5')
    }`}
  >
    <div className="flex items-center gap-2 min-w-0">
      {item.icon && <item.icon size={12} className={currentPage === item.path ? 'text-brand-teal' : 'opacity-50'} />}
      <span className="truncate">{item.label}</span>
      {item.path && item.path.includes('http') && <ExternalLink size={10} className="opacity-40" />}
    </div>
    {item.comingSoon && (
      <span className="text-[7px] bg-[#F59E0B]/10 text-[#F59E0B] px-1.5 py-0.5 rounded font-black uppercase border border-[#F59E0B]/20">
        Soon
      </span>
    )}
  </button>
);

export default Sidebar;
