/**
 * ScalesManagement — DEPRECATED
 *
 * This component has been superseded by PerformanceScale
 * (src/components/CBCGrading/pages/PerformanceScale.jsx), which is the
 * live, API-connected performance scale manager used throughout the app.
 *
 * The old implementation stored scales in localStorage and used a hardcoded
 * 4-level rubric with a typo ('AP' instead of 'AE'). It was never wired into
 * the main CBCGradingSystem router.
 *
 * This shim re-exports PerformanceScale under the old name so any legacy
 * import of ScalesManagement continues to work without error, while always
 * rendering the correct component.
 */

export { default } from '../../../components/CBCGrading/pages/PerformanceScale';
