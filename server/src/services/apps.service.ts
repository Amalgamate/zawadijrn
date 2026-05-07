import prisma from '../config/database';
import { ApiError } from '../utils/error.util';

export type AppAuditAction = 'ACTIVATED' | 'DEACTIVATED' | 'LOCKED' | 'UNLOCKED' | 'SHOWN' | 'HIDDEN';

interface ToggleAppParams {
  schoolId: string;
  slug: string;
  performedByUserId: string;
  performedByRole: string;
  ipAddress?: string;
  userAgent?: string;
}

interface SetMandatoryParams extends ToggleAppParams {
  isMandatory: boolean;
}

interface SetVisibilityParams extends ToggleAppParams {
  isVisible: boolean;
}

interface EnableAllParams {
  schoolId: string;
  performedByUserId: string;
  performedByRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AppsService {
  private static _isUpdatedByWriteError(error: any) {
    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('updatedbyid') ||
      message.includes('school_app_configs_updatedbyid_fkey') ||
      message.includes('does not exist in the current database')
    );
  }

  /**
   * Compatibility-safe update for legacy school DBs where `updatedById`
   * column or FK may be missing/misaligned.
   */
  private static async _updateConfigSafe(
    schoolId: string,
    appId: string,
    data: Record<string, any>,
    performedByUserId?: string,
  ) {
    try {
      return await prisma.schoolAppConfig.update({
        where: { schoolId_appId: { schoolId, appId } },
        data: performedByUserId ? { ...data, updatedById: performedByUserId } : data,
      });
    } catch (error: any) {
      if (!performedByUserId || !AppsService._isUpdatedByWriteError(error)) {
        throw error;
      }

      return prisma.schoolAppConfig.update({
        where: { schoolId_appId: { schoolId, appId } },
        data,
      });
    }
  }

  /** Resolve an app by slug — throws 404 if not found */
  private static async _resolveApp(slug: string) {
    const app = await prisma.app.findUnique({ where: { slug } });
    if (!app) throw new ApiError(404, `App '${slug}' not found`);
    return app;
  }

  /** Ensure a SchoolAppConfig row exists, creating it if absent */
  private static async _ensureConfig(schoolId: string, appId: string) {
    return prisma.schoolAppConfig.upsert({
      where: { schoolId_appId: { schoolId, appId } },
      update: {},
      create: { schoolId, appId },
    });
  }

  /** Write an immutable audit log row */
  private static async _audit(
    schoolId: string,
    appId: string,
    action: AppAuditAction,
    performedBy: string,
    roleAtTime: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await prisma.appAuditLog.create({
        data: {
          schoolId,
          appId,
          action,
          performedBy,
          roleAtTime,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        },
      });
    } catch (error: any) {
      // Audit should never block app activation/deactivation.
      // If audit persistence fails (e.g. legacy user mismatch), continue safely.
      console.warn('[AppsService] Audit log write failed (non-blocking):', error?.message || error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────

  /**
   * List all apps with current school state.
   * School admins only see visible apps; super admins see everything.
   */
  static async listApps(schoolId: string, isSuperAdmin: boolean) {
    const apps = await prisma.app.findMany({
      where: isSuperAdmin ? {} : { isSystem: false },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      include: {
        configs: {
          where: { schoolId },
        },
      },
    });

    return apps
      .filter(app => {
        if (isSuperAdmin) return true;
        const cfg = app.configs[0];
        // school admin cannot see: system apps, or apps hidden by super admin
        return !app.isSystem && (cfg?.isVisible !== false);
      })
      .map(app => {
        const cfg = app.configs[0] ?? null;
        return {
          id:           app.id,
          slug:         app.slug,
          name:         app.name,
          description:  app.description,
          category:     app.category,
          icon:         app.icon,
          sortOrder:    app.sortOrder,
          dependencies: app.dependencies,
          isSystem:     app.isSystem,
          isActive:     cfg?.isActive    ?? false,
          isMandatory:  cfg?.isMandatory ?? false,
          isVisible:    cfg?.isVisible   ?? true,
          updatedAt:    cfg?.updatedAt   ?? null,
        };
      });
  }

  /**
   * Toggle isActive on a single app.
   * - School admin cannot toggle mandatory apps.
   * - When activating, dependencies are auto-activated.
   * - When deactivating, checks nothing depends on this app.
   */
  static async toggleApp(params: ToggleAppParams) {
    const { schoolId, slug, performedByUserId, performedByRole, ipAddress, userAgent } = params;
    const isSuperAdmin = performedByRole === 'SUPER_ADMIN';

    const app = await AppsService._resolveApp(slug);
    const cfg = await AppsService._ensureConfig(schoolId, app.id);

    // School admin cannot toggle a mandatory app
    if (!isSuperAdmin && cfg.isMandatory) {
      throw new ApiError(403, `App '${app.name}' is mandatory and cannot be toggled.`);
    }

    const newState = !cfg.isActive;

    if (newState) {
      // Activating — first activate all dependencies
      await AppsService._activateDependencies(schoolId, app.dependencies as string[], performedByUserId, performedByRole, ipAddress, userAgent);
    } else {
      // Deactivating — check no active app depends on this one
      await AppsService._checkNoDependants(schoolId, slug);
    }

    await AppsService._updateConfigSafe(
      schoolId,
      app.id,
      { isActive: newState },
      performedByUserId,
    );

    await AppsService._audit(
      schoolId, app.id,
      newState ? 'ACTIVATED' : 'DEACTIVATED',
      performedByUserId, performedByRole, ipAddress, userAgent,
    );

    return { slug, isActive: newState };
  }

  /** Set isMandatory flag — SUPER_ADMIN only */
  static async setMandatory(params: SetMandatoryParams) {
    const { schoolId, slug, isMandatory, performedByUserId, performedByRole, ipAddress, userAgent } = params;

    const app = await AppsService._resolveApp(slug);
    await AppsService._ensureConfig(schoolId, app.id);

    await AppsService._updateConfigSafe(
      schoolId,
      app.id,
      { isMandatory },
      performedByUserId,
    );

    await AppsService._audit(
      schoolId, app.id,
      isMandatory ? 'LOCKED' : 'UNLOCKED',
      performedByUserId, performedByRole, ipAddress, userAgent,
    );

    return { slug, isMandatory };
  }

  /** Set isVisible flag — SUPER_ADMIN only */
  static async setVisibility(params: SetVisibilityParams) {
    const { schoolId, slug, isVisible, performedByUserId, performedByRole, ipAddress, userAgent } = params;

    const app = await AppsService._resolveApp(slug);
    await AppsService._ensureConfig(schoolId, app.id);

    await AppsService._updateConfigSafe(
      schoolId,
      app.id,
      { isVisible },
      performedByUserId,
    );

    await AppsService._audit(
      schoolId, app.id,
      isVisible ? 'SHOWN' : 'HIDDEN',
      performedByUserId, performedByRole, ipAddress, userAgent,
    );

    return { slug, isVisible };
  }

  /**
   * Activate all non-system apps for a school.
   * Super admin can include system apps if requested by future extension.
   */
  static async enableAllApps(params: EnableAllParams) {
    const { schoolId, performedByUserId, performedByRole, ipAddress, userAgent } = params;

    const apps = await prisma.app.findMany({
      where: { isSystem: false },
      orderBy: { sortOrder: 'asc' }
    });

    const activated: string[] = [];

    for (const app of apps) {
      const cfg = await AppsService._ensureConfig(schoolId, app.id);
      if (cfg.isActive) continue;

      await AppsService._activateDependencies(
        schoolId,
        (app.dependencies as string[]) || [],
        performedByUserId,
        performedByRole,
        ipAddress,
        userAgent
      );

      await AppsService._updateConfigSafe(
        schoolId,
        app.id,
        { isActive: true },
        performedByUserId,
      );

      await AppsService._audit(
        schoolId,
        app.id,
        'ACTIVATED',
        performedByUserId,
        performedByRole,
        ipAddress,
        userAgent
      );

      activated.push(app.slug);
    }

    return { activatedCount: activated.length, activated };
  }

  // ─────────────────────────────────────────────────────────────
  // AUDIT LOG
  // ─────────────────────────────────────────────────────────────

  /** Full audit log for SUPER_ADMIN */
  static async getFullAuditLog(schoolId: string, limit = 100) {
    return prisma.appAuditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        app: { select: { slug: true, name: true, icon: true } },
        performer: { select: { firstName: true, lastName: true } },
      },
    });
  }

  /** Own-actions audit log for school admin */
  static async getMyAuditLog(schoolId: string, userId: string, limit = 100) {
    return prisma.appAuditLog.findMany({
      where: { schoolId, performedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        app: { select: { slug: true, name: true, icon: true } },
        performer: { select: { firstName: true, lastName: true } },
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SEED HELPERS (called from a seed script, not exposed via API)
  // ─────────────────────────────────────────────────────────────

  /** Upsert a single app definition (idempotent seed) */
  static async upsertAppDefinition(data: {
    slug: string;
    name: string;
    description?: string;
    category: string;
    icon?: string;
    sortOrder?: number;
    dependencies?: string[];
    isSystem?: boolean;
  }) {
    return prisma.app.upsert({
      where: { slug: data.slug },
      update: {
        name:         data.name,
        description:  data.description,
        category:     data.category,
        icon:         data.icon,
        sortOrder:    data.sortOrder ?? 0,
        dependencies: data.dependencies ?? [],
        isSystem:     data.isSystem ?? false,
      },
      create: {
        slug:         data.slug,
        name:         data.name,
        description:  data.description,
        category:     data.category,
        icon:         data.icon,
        sortOrder:    data.sortOrder ?? 0,
        dependencies: data.dependencies ?? [],
        isSystem:     data.isSystem ?? false,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────

  /** Activate all dependency apps (if not already active) */
  private static async _activateDependencies(
    schoolId: string,
    depSlugs: string[],
    performedByUserId: string,
    performedByRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!depSlugs.length) return;

    const depApps = await prisma.app.findMany({ where: { slug: { in: depSlugs } } });

    for (const depApp of depApps) {
      const depCfg = await AppsService._ensureConfig(schoolId, depApp.id);
      if (!depCfg.isActive) {
        await AppsService._updateConfigSafe(
          schoolId,
          depApp.id,
          { isActive: true },
          performedByUserId,
        );
        await AppsService._audit(schoolId, depApp.id, 'ACTIVATED', performedByUserId, performedByRole, ipAddress, userAgent);
      }
    }
  }

  /**
   * Ensure no currently active app declares `slug` as a dependency.
   * If one does, throw 400 listing what needs to be disabled first.
   */
  private static async _checkNoDependants(schoolId: string, slug: string) {
    // Find all apps whose dependencies array includes this slug
    const allApps = await prisma.app.findMany();
    const dependants = allApps.filter(a => (a.dependencies as string[]).includes(slug));

    if (!dependants.length) return;

    // Check which are currently active for this school
    const dependantIds = dependants.map(a => a.id);
    const activeConfigs = await prisma.schoolAppConfig.findMany({
      where: { schoolId, appId: { in: dependantIds }, isActive: true },
      include: { app: { select: { name: true } } },
    });

    if (activeConfigs.length) {
      const names = activeConfigs.map(c => c.app.name).join(', ');
      throw new ApiError(
        400,
        `Cannot deactivate: the following active apps depend on it — ${names}. Disable them first.`,
      );
    }
  }
}
