/**
 * Sidebar Component — Industry-Grade Rewrite
 *
 * Key improvements over previous version:
 * - Removed flyout dependency for collapsed mode (global top horizontal submenu handles children)
 * - Perfect icon centering in collapsed mode (w-16 / 64px column)
 * - Category labels are static; section children list in full when expanded (no in-sidebar accordions)
 * - Consistent 44px touch-target row heights throughout
 * - Portal flyout aligned flush to sidebar right edge with no gap
 * - Single source of truth for hover state (ref + setState)
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Menu, X,
  School, Boxes,
  GraduationCap,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { useInstitutionLabels } from '../../../hooks/useInstitutionLabels';
import { usePermissions } from '../../../hooks/usePermissions';

// ─── constants ────────────────────────────────────────────────────────────────
const SIDEBAR_COLLAPSED_W = 64;   // px  (w-16)
const SIDEBAR_EXPANDED_W  = 224;  // px  (w-56)
const HEADER_H            = 72;   // px  — must match the logo bar below

// ─── helpers ──────────────────────────────────────────────────────────────────
const findDefaultPath = (items = []) => {
  for (const item of items) {
    if (item.type === 'group') {
      const p = findDefaultPath(item.items);
      if (p) return p;
    } else if (!item.greyedOut && item.path) {
      return item.path;
    }
  }
  return null;
};

// ─── Sidebar (root) ───────────────────────────────────────────────────────────
const Sidebar = React.memo(({
  sidebarOpen,
  setSidebarOpen,
  currentPage,
  onNavigate,
  brandingSettings,
  user,
}) => {
  const labels = useInstitutionLabels();
  const { role } = usePermissions();

  // ── category labels (static; flyout + expanded sidebar use flat item lists) ──
  const {
    navSections,
    dashboardSection,
    communicationSection,
    schoolSections,
    lmsSection,
    studentLmsSection,
    backOfficeSections,
    docsCenterSection,
    systemAdminSections,
  } = useNavigation();

  // Collapsed rail: jump to first child route, or expand sidebar if none
  const handleSectionClick = useCallback((section) => {
    const path = findDefaultPath(section.items);
    if (path) onNavigate(path);
    else if (!sidebarOpen) setSidebarOpen(true);
  }, [onNavigate, setSidebarOpen, sidebarOpen]);

  const sharedNavProps = {
    handleSectionClick,
    sidebarOpen,
    currentPage,
    onNavigate,
  };

  const sidebarW = sidebarOpen ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W;

  return (
    <>
      {/* ── Sidebar panel ─────────────────────────────────────────────────── */}
      <aside
        style={{ width: sidebarW }}
        className="relative flex flex-col h-full bg-[var(--brand-purple)] text-white transition-[width] duration-300 ease-in-out border-r border-white/10 shadow-xl flex-shrink-0 z-30"
      >
        {/* Logo bar */}
        <div
          style={{ height: HEADER_H }}
          className="flex items-center justify-center px-3 border-b border-white/10 bg-[var(--brand-purple-dark)] overflow-hidden flex-shrink-0"
        >
          {brandingSettings?.logoUrl ? (
            <img
              src={brandingSettings.logoUrl}
              alt="School Logo"
              className={`object-contain transition-all duration-300 ${sidebarOpen ? 'h-11 max-w-full' : 'h-9 w-9'}`}
            />
          ) : sidebarOpen ? (
            <span className="text-base font-black text-white tracking-wider truncate text-center leading-tight px-1">
              {brandingSettings?.schoolName || 'ZAWADI'}
            </span>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <span className="text-sm font-black text-white">
                {(brandingSettings?.schoolName || 'ZA').substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Nav scroll area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 custom-scrollbar">

          {/* Dashboard */}
          {dashboardSection && (
            <SingleItem
              section={dashboardSection}
              currentPage={currentPage}
              onNavigate={onNavigate}
              sidebarOpen={sidebarOpen}
            />
          )}

          {/* Communications */}
          {communicationSection && (
            <NavSection key={communicationSection.id} section={communicationSection} {...sharedNavProps} />
          )}

          {/* ── School group ─────────────────────────────────────── */}
          {schoolSections.length > 0 && (
            <CategoryGroup label={labels.schoolGroup || "School"} icon={School} sidebarOpen={sidebarOpen}>
              {schoolSections.map(s => <NavSection key={s.id} section={s} {...sharedNavProps} />)}
            </CategoryGroup>
          )}

          {/* LMS */}
          {lmsSection && <NavSection key={lmsSection.id} section={lmsSection} {...sharedNavProps} />}

          {/* Student Portal */}
          {studentLmsSection && <NavSection key={studentLmsSection.id} section={studentLmsSection} {...sharedNavProps} />}

          {/* ── Back Office group ─────────────────────────────────── */}
          {backOfficeSections.length > 0 && (
            <CategoryGroup label={labels.backOfficeGroup || "Back Office"} icon={Boxes} sidebarOpen={sidebarOpen}>
              {backOfficeSections.map(s => <NavSection key={s.id} section={s} {...sharedNavProps} />)}
            </CategoryGroup>
          )}

          {/* Document Center */}
          {docsCenterSection && <NavSection key={docsCenterSection.id} section={docsCenterSection} {...sharedNavProps} />}
        </nav>

        {/* Footer — System Admin + collapse toggle */}
        <footer className="flex-shrink-0 border-t border-white/10 bg-[var(--brand-purple-dark)] px-2 py-2 space-y-0.5">
          {systemAdminSections.length > 0 && (
            <>
              {sidebarOpen && (
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1 px-3">
                  {role === 'TEACHER' ? labels.teacher : 
                   role === 'PARENT' ? 'Parent' : 
                   role === 'ADMIN' ? 'Administrator' : 
                   role === 'HEAD_TEACHER' ? (labels.headLabel || 'Principal') : 
                   (user?.role || 'Guest')}
                </p>
              )}
              {systemAdminSections.map(s => (
                <NavSection key={s.id} section={s} {...sharedNavProps} isBottom />
              ))}
            </>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 rounded-lg transition-all duration-200 text-white/50 hover:text-white hover:bg-white/10"
            style={{ height: 40 }}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 20 }}>
              {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
            </span>
            {sidebarOpen && <span className="text-xs font-semibold">Collapse</span>}
          </button>
        </footer>
      </aside>

    </>
  );
});

// ─── CategoryGroup ─────────────────────────────────────────────────────────────
/** Section label only — items stay visible (no accordion); collapsed rail still lists icons. */
const CategoryGroup = ({ label, icon: Icon, sidebarOpen, children }) => (
  <div className="mt-1">
    {sidebarOpen && (
      <div
        className="w-full flex items-center gap-2 px-3 text-white/40 pointer-events-none"
        style={{ height: 34 }}
      >
        <Icon size={13} className="flex-shrink-0" />
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-brand-teal">{label}</span>
      </div>
    )}
    <div className="space-y-0.5 pt-0.5">
      {children}
    </div>
  </div>
);

// ─── SingleItem (leaf, no children — e.g. Dashboard / Help) ───────────────────
const SingleItem = ({ section, currentPage, onNavigate, sidebarOpen }) => {
  const isActive = currentPage === section.id;
  return (
    <button
      onClick={() => !section.greyedOut && onNavigate(section.id)}
      disabled={!!section.greyedOut}
      title={!sidebarOpen ? section.label : undefined}
      className={`
        relative w-full flex items-center gap-3 px-3 rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-white/15 text-white font-semibold shadow-sm ring-1 ring-white/20'
          : 'text-white/60 hover:text-white hover:bg-white/8'}
        ${section.greyedOut ? 'opacity-40 cursor-not-allowed' : ''}
      `}
      style={{ height: 44 }}
    >
      {isActive && (
        <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-brand-teal rounded-r-full" />
      )}
      <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 20 }}>
        <section.icon size={18} />
      </span>
      {sidebarOpen && (
        <span className="text-sm font-semibold truncate">{section.label}</span>
      )}
    </button>
  );
};

// ─── NavSection ────────────────────────────────────────────────────────────────
const NavSection = React.memo(({
  section,
  handleSectionClick,
  sidebarOpen,
  currentPage,
  onNavigate,
  isBottom = false,
}) => {
  const hasChildren    = (section.items?.length || 0) > 0;

  const isChildActive = useMemo(() => {
    if (!hasChildren) return false;
    const check = (items) => (items || []).some(i =>
      i.type === 'group' ? check(i.items) : i.path === currentPage
    );
    return check(section.items);
  }, [section.items, currentPage, hasChildren]);

  const isActive = currentPage === section.id || isChildActive;
  const isAssessment = section.id === 'assessment';
  const isSettings = section.id === 'settings';

  const [isExpanded, setIsExpanded] = useState(isActive);

  // Auto-expand if a child becomes active (e.g. via direct URL navigation)
  useEffect(() => {
    if (isChildActive && isSettings) {
      setIsExpanded(true);
    }
  }, [isChildActive, isSettings]);

  if (!hasChildren) {
    return (
      <SingleItem
        section={section}
        currentPage={currentPage}
        onNavigate={onNavigate}
        sidebarOpen={sidebarOpen}
      />
    );
  }

  const headerClass = `
          relative w-full flex items-center px-3 rounded-lg
          transition-all duration-200
          ${isAssessment
            ? (isActive
                ? 'text-amber-300 bg-amber-500/10'
                : 'text-amber-400/70')
            : (isActive
                ? 'text-white bg-white/8'
                : 'text-white/60')
          }
          ${section.greyedOut ? 'opacity-40' : ''}
        `;

  const sectionItemsBlock = (
    <div className={`ml-[11px] mt-1 border-l border-white/10 pl-3 space-y-0.5 ${isBottom ? 'mb-2' : 'mb-1'}`}>
      {section.items.map(item => {
        if (item.type === 'group') {
          return (
            <div key={item.id} className="mb-2 last:mb-0">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white/45">
                {item.icon && <item.icon size={11} className="opacity-70 flex-shrink-0" />}
                <span>{item.label}</span>
              </div>
              <div className="ml-1 border-l border-white/10 pl-2 space-y-0.5 pt-0.5">
                {(item.items || []).map(sub => (
                  <LeafItem
                    key={sub.id}
                    item={sub}
                    currentPage={currentPage}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        }
        return (
          <LeafItem
            key={item.id}
            item={item}
            currentPage={currentPage}
            onNavigate={onNavigate}
          />
        );
      })}
    </div>
  );

  return (
    <div>
      {sidebarOpen ? (
        <>
          <div
            className={`${headerClass} ${isSettings ? 'cursor-pointer' : 'pointer-events-none'}`}
            style={{ height: 40 }}
            onClick={() => isSettings && setIsExpanded(!isExpanded)}
            role={isSettings ? "button" : undefined}
            tabIndex={isSettings ? 0 : -1}
          >
            {isActive && (
              <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-brand-teal rounded-r-full" />
            )}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 20 }}>
                <section.icon size={18} />
              </span>
              <span className="text-sm font-semibold truncate text-left flex-1">{section.label}</span>
              
              {isSettings && (
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-200 text-white/40 ${isExpanded ? 'rotate-180' : ''}`}
                />
              )}
            </div>
          </div>
          {(!isSettings || isExpanded) && sectionItemsBlock}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => !section.greyedOut && handleSectionClick(section)}
            disabled={!!section.greyedOut}
            title={section.label}
            className={`${headerClass} ${
              isAssessment ? 'hover:text-amber-300 hover:bg-amber-500/10' : 'hover:text-white hover:bg-white/8'
            } ${section.greyedOut ? 'cursor-not-allowed' : ''}`}
            style={{ height: 44 }}
          >
            {isActive && (
              <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-brand-teal rounded-r-full" />
            )}
            <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
              <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 20 }}>
                <section.icon size={18} />
              </span>
            </div>
          </button>
        </>
      )}
    </div>
  );
});

// ─── LeafItem ──────────────────────────────────────────────────────────────────
const LeafItem = ({ item, currentPage, onNavigate }) => {
  const isActive = currentPage === item.path;

  return (
    <button
      onClick={() => !item.greyedOut && !item.comingSoon && onNavigate(item.path)}
      disabled={!!(item.greyedOut || item.comingSoon)}
      className={`
        w-full text-left flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-all duration-150
        ${item.greyedOut || item.comingSoon
          ? 'text-white/25 cursor-not-allowed'
          : isActive
            ? 'text-white font-semibold bg-white/10'
            : 'text-white/55 hover:text-white hover:bg-white/5'}
      `}
    >
      <span className="truncate flex-1">{item.label}</span>
      {item.comingSoon && (
        <span className="ml-2 flex-shrink-0 text-[8px] bg-amber-400/15 text-amber-400 px-1.5 py-0.5 rounded font-black uppercase border border-amber-400/25 tracking-wide">
          Soon
        </span>
      )}
    </button>
  );
};

// ─── display names ─────────────────────────────────────────────────────────────
Sidebar.displayName    = 'Sidebar';
NavSection.displayName = 'NavSection';

export default Sidebar;
