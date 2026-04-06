/**
 * Sidebar Component — Industry-Grade Rewrite
 *
 * Key improvements over previous version:
 * - Flyout hover is rock-solid: invisible "bridge" strip + shared ref cancel prevents flicker
 * - Perfect icon centering in collapsed mode (w-16 / 64px column)
 * - Category groups use smooth CSS height transition, not conditional rendering flash
 * - Consistent 44px touch-target row heights throughout
 * - Portal flyout aligned flush to sidebar right edge with no gap
 * - Single source of truth for hover state (ref + setState)
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu, X, ChevronRight, ChevronDown,
  School, Boxes, ExternalLink, Pin
} from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import { useNavigation, allNavSections } from '../hooks/useNavigation';

// ─── constants ────────────────────────────────────────────────────────────────
const SIDEBAR_COLLAPSED_W = 64;   // px  (w-16)
const SIDEBAR_EXPANDED_W  = 224;  // px  (w-56)
const HEADER_H            = 72;   // px  — must match the logo bar below
const FLYOUT_DELAY_MS     = 120;  // ms  — delay before closing flyout

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
  expandedSections,
  toggleSection,
  brandingSettings,
}) => {
  const { role } = usePermissions();

  // ── flyout state ────────────────────────────────────────────────────────────
  const [flyoutSection, setFlyoutSection]   = useState(null);
  const [isPinned,      setIsPinned]        = useState(false);
  const closeTimerRef = useRef(null);

  const scheduleFlyoutClose = useCallback(() => {
    if (isPinned) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setFlyoutSection(null), FLYOUT_DELAY_MS);
  }, [isPinned]);

  const cancelFlyoutClose = useCallback(() => {
    clearTimeout(closeTimerRef.current);
  }, []);

  const openFlyout = useCallback((section) => {
    if (sidebarOpen || !section?.items?.length) return;
    cancelFlyoutClose();
    setFlyoutSection(section);
  }, [sidebarOpen, cancelFlyoutClose]);

  // close flyout when sidebar expands
  useEffect(() => {
    if (sidebarOpen) setFlyoutSection(null);
  }, [sidebarOpen]);

  // cleanup timer on unmount
  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // ── sub-section accordion (assessment groups) ───────────────────────────────
  const [expandedSubSections, setExpandedSubSections] = useState({
    'group-summative': true,
    'group-formative': false,
    'group-general':   true,
  });

  const toggleSubSection = useCallback((id) => {
    setExpandedSubSections(prev => {
      const opening = !prev[id];
      if (opening) {
        return Object.keys(prev).reduce((acc, k) => { acc[k] = false; return acc; }, { [id]: true });
      }
      return { ...prev, [id]: false };
    });
  }, []);

  // auto-expand group when child is active
  useEffect(() => {
    allNavSections.forEach(section => {
      (section.items || []).forEach(item => {
        if (item.type === 'group') {
          if ((item.items || []).some(sub => sub.path === currentPage)) {
            setExpandedSubSections(prev => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [currentPage]);

  // ── category accordion ───────────────────────────────────────────────────────
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

  const [activeCategory, setActiveCategory] = useState(() => {
    if (['ADMIN', 'SUPER_ADMIN'].includes(role)) return 'school';
    if (['ACCOUNTANT', 'RECEPTIONIST', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM'].includes(role)) return 'backOffice';
    return 'school';
  });

  useEffect(() => {
    const inSchool     = schoolSections.some(s => s.id === currentPage || (s.items || []).some(i => i.path === currentPage));
    const inBackOffice = backOfficeSections.some(s => s.id === currentPage || (s.items || []).some(i => i.path === currentPage));
    const inAdmin      = systemAdminSections.some(s => s.id === currentPage || (s.items || []).some(i => i.path === currentPage));
    if (inSchool)          setActiveCategory('school');
    else if (inBackOffice) setActiveCategory('backOffice');
    else if (inAdmin)      setActiveCategory('admin');
  }, [currentPage, schoolSections, backOfficeSections, systemAdminSections]);

  // ── section click ────────────────────────────────────────────────────────────
  const handleSectionClick = useCallback((section) => {
    if (sidebarOpen) {
      toggleSection(section.id);
    } else {
      const path = findDefaultPath(section.items);
      if (path) onNavigate(path);
      else { setSidebarOpen(true); toggleSection(section.id); }
    }
  }, [sidebarOpen, toggleSection, onNavigate, setSidebarOpen]);

  // ── shared nav-item props ────────────────────────────────────────────────────
  const sharedNavProps = {
    expandedSections,
    handleSectionClick,
    sidebarOpen,
    expandedSubSections,
    toggleSubSection,
    currentPage,
    onNavigate,
    openFlyout,
    scheduleFlyoutClose,
    cancelFlyoutClose,
    flyoutSection,
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
            <CategoryGroup
              label="School"
              icon={School}
              categoryKey="school"
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              sidebarOpen={sidebarOpen}
            >
              {schoolSections.map(s => <NavSection key={s.id} section={s} {...sharedNavProps} />)}
            </CategoryGroup>
          )}

          {/* LMS */}
          {lmsSection && <NavSection key={lmsSection.id} section={lmsSection} {...sharedNavProps} />}

          {/* Student Portal */}
          {studentLmsSection && <NavSection key={studentLmsSection.id} section={studentLmsSection} {...sharedNavProps} />}

          {/* ── Back Office group ─────────────────────────────────── */}
          {backOfficeSections.length > 0 && (
            <CategoryGroup
              label="Back Office"
              icon={Boxes}
              categoryKey="backOffice"
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              sidebarOpen={sidebarOpen}
            >
              {backOfficeSections.map(s => <NavSection key={s.id} section={s} {...sharedNavProps} />)}
            </CategoryGroup>
          )}

          {/* Documents */}
          {docsCenterSection && <NavSection key={docsCenterSection.id} section={docsCenterSection} {...sharedNavProps} />}
        </nav>

        {/* Footer — System Admin + collapse toggle */}
        <footer className="flex-shrink-0 border-t border-white/10 bg-[var(--brand-purple-dark)] px-2 py-2 space-y-0.5">
          {systemAdminSections.length > 0 && (
            <>
              {sidebarOpen && (
                <p className="px-3 pt-1 pb-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
                  System
                </p>
              )}
              {systemAdminSections.map(s => (
                <NavSection key={s.id} section={s} {...sharedNavProps} isBottom />
              ))}
            </>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
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

      {/* ── Flyout panel (portal) ──────────────────────────────────────────── */}
      {!sidebarOpen && flyoutSection && createPortal(
        <FlyoutPanel
          section={flyoutSection}
          left={SIDEBAR_COLLAPSED_W}
          top={HEADER_H}
          currentPage={currentPage}
          onNavigate={(path) => {
            onNavigate(path);
            if (!isPinned) setFlyoutSection(null);
          }}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          onMouseEnter={cancelFlyoutClose}
          onMouseLeave={scheduleFlyoutClose}
        />,
        document.body
      )}
    </>
  );
});

// ─── CategoryGroup ─────────────────────────────────────────────────────────────
const CategoryGroup = ({ label, icon: Icon, categoryKey, activeCategory, setActiveCategory, sidebarOpen, children }) => {
  const isOpen = activeCategory === categoryKey;

  return (
    <div className="mt-1">
      {sidebarOpen && (
        <button
          onClick={() => setActiveCategory(prev => prev === categoryKey ? null : categoryKey)}
          className="w-full flex items-center justify-between px-3 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
          style={{ height: 34 }}
        >
          <div className="flex items-center gap-2">
            <Icon size={13} className="flex-shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-brand-teal">{label}</span>
          </div>
          <ChevronDown
            size={12}
            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Always show items when collapsed; respect toggle when expanded */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? (isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0')
            : 'max-h-[800px] opacity-100'
        }`}
      >
        <div className="space-y-0.5 pt-0.5">
          {children}
        </div>
      </div>
    </div>
  );
};

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
  expandedSections,
  handleSectionClick,
  sidebarOpen,
  expandedSubSections,
  toggleSubSection,
  currentPage,
  onNavigate,
  openFlyout,
  scheduleFlyoutClose,
  cancelFlyoutClose,
  flyoutSection,
  isBottom = false,
}) => {
  const isExpanded     = !!expandedSections[section.id];
  const isFlyoutActive = !sidebarOpen && flyoutSection?.id === section.id;
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

  return (
    <div
      onMouseEnter={() => { cancelFlyoutClose(); openFlyout(section); }}
      onMouseLeave={scheduleFlyoutClose}
    >
      {/* Section header button */}
      <button
        onClick={() => handleSectionClick(section)}
        title={!sidebarOpen ? section.label : undefined}
        className={`
          relative w-full flex items-center justify-between px-3 rounded-lg
          transition-all duration-200 group
          ${isAssessment
            ? (isExpanded || isFlyoutActive
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30'
                : isActive
                  ? 'text-amber-300 bg-amber-500/10'
                  : 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10')
            : (isExpanded || isFlyoutActive
                ? 'bg-white/12 text-white ring-1 ring-white/15'
                : isActive
                  ? 'text-white bg-white/8'
                  : 'text-white/60 hover:text-white hover:bg-white/8')
          }
          ${section.greyedOut ? 'opacity-40 cursor-not-allowed' : ''}
        `}
        style={{ height: 44 }}
      >
        {/* Active indicator strip */}
        {(isActive || isExpanded) && (
          <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-brand-teal rounded-r-full" />
        )}

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className={`flex-shrink-0 flex items-center justify-center transition-transform duration-200 ${(isExpanded || isFlyoutActive) ? 'scale-110' : ''}`}
            style={{ width: 20 }}
          >
            <section.icon size={18} />
          </span>
          {sidebarOpen && (
            <span className="text-sm font-semibold truncate text-left">{section.label}</span>
          )}
        </div>

        {sidebarOpen && (
          <ChevronDown
            size={14}
            className={`flex-shrink-0 opacity-40 group-hover:opacity-80 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Expanded children (only when sidebar is open) */}
      {sidebarOpen && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className={`ml-[11px] mt-1 border-l border-white/10 pl-3 space-y-0.5 ${isBottom ? 'mb-2' : 'mb-1'}`}>
            {section.items.map(item => {
              if (item.type === 'group') {
                return (
                  <SubGroup
                    key={item.id}
                    group={item}
                    currentPage={currentPage}
                    onNavigate={onNavigate}
                    expandedSubSections={expandedSubSections}
                    toggleSubSection={toggleSubSection}
                  />
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
        </div>
      )}
    </div>
  );
});

// ─── SubGroup (e.g. Summative / Formative inside Assessment) ──────────────────
const SubGroup = ({ group, currentPage, onNavigate, expandedSubSections, toggleSubSection }) => {
  const isOpen        = !!expandedSubSections[group.id];
  const isChildActive = (group.items || []).some(i => i.path === currentPage);

  return (
    <div>
      <button
        onClick={() => !group.greyedOut && toggleSubSection(group.id)}
        disabled={!!group.greyedOut}
        className={`w-full flex items-center justify-between pr-1 py-1.5 text-xs font-bold transition-colors duration-150 rounded-md ${
          group.greyedOut
            ? 'text-white/25 cursor-not-allowed'
            : isChildActive
              ? 'text-brand-teal'
              : 'text-white/50 hover:text-white/80'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {group.icon && <group.icon size={11} className="opacity-70" />}
          <span className="uppercase tracking-wide text-[10px]">{group.label}</span>
        </div>
        <ChevronRight
          size={10}
          className={`opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pl-2 border-l border-white/10 space-y-0.5 pt-0.5 pb-1">
          {(group.items || []).map(item => (
            <LeafItem key={item.id} item={item} currentPage={currentPage} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
};

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

// ─── FlyoutPanel ───────────────────────────────────────────────────────────────
const FlyoutPanel = ({
  section,
  left,
  top,
  currentPage,
  onNavigate,
  isPinned,
  setIsPinned,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      style={{ left, top, bottom: 0, position: 'fixed', zIndex: 9999, display: 'flex' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Invisible 4px bridge strip — prevents gap-triggered close */}
      <div style={{ width: 4, flexShrink: 0 }} />

      {/* Flyout body */}
      <div
        className="w-64 flex flex-col bg-white border-r border-slate-200/80 shadow-[4px_0_32px_rgba(0,0,0,0.1)] overflow-hidden"
        style={{ animation: 'flyoutIn 0.14s ease-out both' }}
      >
        {/* Header */}
        <div className="px-4 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-0.5">Navigate</p>
            <p className="text-sm font-black text-slate-800 leading-tight">{section.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPinned(v => !v)}
              title={isPinned ? 'Unpin' : 'Pin open'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isPinned
                  ? 'bg-[var(--brand-purple)] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }`}
            >
              <Pin size={14} className={isPinned ? 'fill-current' : ''} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-purple)]/8 border border-[var(--brand-purple)]/15 flex items-center justify-center text-[var(--brand-purple)]">
              <section.icon size={18} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {(section.items || []).map(item => {
            if (item.type === 'group') {
              return (
                <div key={item.id} className="mb-3">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 bg-slate-50 rounded-md border border-slate-100">
                    {item.icon && <item.icon size={10} className="opacity-70" />}
                    {item.label}
                  </div>
                  <div className="ml-1.5 border-l-2 border-slate-100 pl-2 space-y-0.5">
                    {(item.items || []).map(sub => (
                      <FlyoutLeaf key={sub.id} item={sub} currentPage={currentPage} onNavigate={onNavigate} />
                    ))}
                  </div>
                </div>
              );
            }
            return <FlyoutLeaf key={item.id} item={item} currentPage={currentPage} onNavigate={onNavigate} />;
          })}
        </div>
      </div>
    </div>
  );
};

// ─── FlyoutLeaf ────────────────────────────────────────────────────────────────
const FlyoutLeaf = ({ item, currentPage, onNavigate }) => {
  const isActive = currentPage === item.path;

  return (
    <button
      onClick={() => !item.greyedOut && !item.comingSoon && onNavigate(item.path)}
      disabled={!!(item.greyedOut || item.comingSoon)}
      className={`
        w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150
        ${item.greyedOut
          ? 'text-slate-300 cursor-not-allowed'
          : isActive
            ? 'bg-[var(--brand-purple)]/6 text-[var(--brand-purple)] font-bold border border-[var(--brand-purple)]/12 shadow-sm'
            : 'text-slate-600 hover:text-[var(--brand-purple)] hover:bg-[var(--brand-purple)]/5 active:scale-[0.98]'}
      `}
    >
      <div className="flex items-center gap-2 min-w-0">
        {item.icon && (
          <item.icon size={12} className={isActive ? 'text-brand-teal' : 'opacity-40'} />
        )}
        <span className="truncate">{item.label}</span>
        {item.path?.includes('http') && <ExternalLink size={9} className="opacity-30 flex-shrink-0" />}
      </div>
      {item.comingSoon && (
        <span className="ml-2 flex-shrink-0 text-[7px] bg-amber-400/12 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase border border-amber-400/20">
          Soon
        </span>
      )}
    </button>
  );
};

// ─── Keyframe for flyout entrance ─────────────────────────────────────────────
// Injected once into document head
if (typeof document !== 'undefined' && !document.getElementById('zawadi-flyout-anim')) {
  const style = document.createElement('style');
  style.id = 'zawadi-flyout-anim';
  style.textContent = `
    @keyframes flyoutIn {
      from { opacity: 0; transform: translateX(-6px); }
      to   { opacity: 1; transform: translateX(0);    }
    }
  `;
  document.head.appendChild(style);
}

// ─── display names ─────────────────────────────────────────────────────────────
Sidebar.displayName    = 'Sidebar';
NavSection.displayName = 'NavSection';

export default Sidebar;
