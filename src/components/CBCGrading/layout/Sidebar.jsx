/**
 * Sidebar Component
 * Navigation sidebar with collapsible sections
 * Role-based permission filtering - Tutors hidden from teachers
 * Focus mode: Only showing Students, Tutors, Parents, Assessment, and Settings
 */

import React, { useMemo, useState } from 'react';
import {
  Menu, X, ChevronDown, School, Boxes
} from 'lucide-react';
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
  const [expandedSubSections, setExpandedSubSections] = useState({
    'group-summative': true,
    'group-formative': false,
    'group-general':   true
  });

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
  isBottom = false
}) => {
  return (
    <div key={section.id}>
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

export default Sidebar;
