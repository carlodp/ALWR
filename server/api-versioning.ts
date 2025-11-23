/**
 * API Versioning System
 *
 * Supports multiple API versions with:
 * - Backward compatibility
 * - Deprecation warnings
 * - Gradual migration path
 * - Version-specific features
 */

import { Request, Response, NextFunction } from 'express';

export interface APIVersion {
  version: string;
  status: 'stable' | 'deprecated' | 'beta';
  releaseDate: string;
  sunsetDate?: string; // When v1 will be shut down
  breaking?: string[]; // Breaking changes from previous version
}

export const API_VERSIONS: Record<string, APIVersion> = {
  v1: {
    version: 'v1',
    status: 'deprecated',
    releaseDate: '2024-01-01',
    sunsetDate: '2025-12-31', // 1 year from now
    breaking: [
      'All v1 endpoints will be removed on 2025-12-31',
      'Please migrate to v2 which includes performance improvements and new features',
    ],
  },
  v2: {
    version: 'v2',
    status: 'stable',
    releaseDate: '2024-11-23',
    breaking: [
      'Analytics endpoints moved to /api/v2/admin/analytics/*',
      'Rate limit headers changed: X-RateLimit-Remaining instead of X-RateLimit-Requests-Remaining',
    ],
  },
};

/**
 * Extract API version from request path
 * Supports: /api/v1/... or /api/v2/... or /api/... (defaults to v2)
 */
export function extractVersion(req: Request): string {
  const pathMatch = req.path.match(/^\/api\/v(\d+)\//);
  return pathMatch ? `v${pathMatch[1]}` : 'v2'; // Default to v2 for /api/... paths
}

/**
 * Middleware to detect and validate API version
 */
export function versionDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const version = extractVersion(req);
  const versionInfo = API_VERSIONS[version];

  if (!versionInfo) {
    return res.status(400).json({
      error: 'Invalid API version',
      message: `Version ${version} is not supported. Supported versions: ${Object.keys(API_VERSIONS).join(', ')}`,
      supportedVersions: Object.values(API_VERSIONS).map((v) => ({
        version: v.version,
        status: v.status,
        releaseDate: v.releaseDate,
      })),
    });
  }

  // Attach version info to request
  (req as any).apiVersion = version;
  (req as any).versionInfo = versionInfo;

  // Add deprecation warning header for v1
  if (version === 'v1') {
    res.setHeader(
      'Deprecation',
      'true'
    );
    res.setHeader(
      'Sunset',
      new Date(versionInfo.sunsetDate || '2025-12-31').toUTCString()
    );
    res.setHeader(
      'Warning',
      `299 - "API v1 is deprecated" "Please migrate to /api/v2/" "${versionInfo.sunsetDate}"`
    );
    res.setHeader('X-API-Warn', `v1 will be sunset on ${versionInfo.sunsetDate}`);
  }

  // Add version info header
  res.setHeader('X-API-Version', version);

  next();
}

/**
 * Get version info endpoint
 */
export function getVersionInfoEndpoint(req: Request, res: Response) {
  const currentVersion = (req as any).apiVersion || 'v2';

  res.json({
    currentVersion,
    currentVersionInfo: API_VERSIONS[currentVersion],
    allVersions: Object.entries(API_VERSIONS).map(([key, value]) => ({
      version: value.version,
      status: value.status,
      releaseDate: value.releaseDate,
      sunsetDate: value.sunsetDate,
      breaking: value.breaking,
    })),
    migrationGuide: {
      from_v1_to_v2: 'https://docs.alwr.local/migration/v1-to-v2',
      deprecationTimeline: {
        current: 'v1 deprecated, v2 stable',
        '2025Q4': 'v1 endpoints will be removed',
      },
    },
  });
}

/**
 * Version comparison utility
 */
export function isVersionDeprecated(version: string): boolean {
  return API_VERSIONS[version]?.status === 'deprecated';
}

export function isVersionStable(version: string): boolean {
  return API_VERSIONS[version]?.status === 'stable';
}

/**
 * Middleware to enforce minimum API version
 */
export function requireMinimumVersion(minimumVersion: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentVersion = (req as any).apiVersion || 'v2';
    const minVersionNum = parseInt(minimumVersion.replace('v', ''));
    const currentVersionNum = parseInt(currentVersion.replace('v', ''));

    if (currentVersionNum < minVersionNum) {
      return res.status(400).json({
        error: 'API version too old',
        message: `This endpoint requires ${minimumVersion} or later. You are using ${currentVersion}.`,
        requiredVersion: minimumVersion,
        currentVersion: currentVersion,
        migrationGuide: `Please upgrade to ${minimumVersion} to access this endpoint.`,
      });
    }

    next();
  };
}

/**
 * Helper to create versioned endpoint response
 */
export function createVersionedResponse(data: any, version: string, statusCode: number = 200) {
  return {
    data,
    version,
    timestamp: new Date().toISOString(),
    ...(isVersionDeprecated(version) && {
      deprecation: {
        status: 'deprecated',
        sunset: API_VERSIONS[version].sunsetDate,
        message: 'This API version is deprecated. Please migrate to v2.',
      },
    }),
  };
}

/**
 * Routing helper - creates version-aware routes
 * Usage: createVersionRoute('/admin/stats', [requireAdmin], handler)
 */
export function createVersionRoute(
  path: string,
  middlewares: any[],
  handler: (req: Request, res: Response) => Promise<void> | void
) {
  return {
    v1: { path: `/api/v1${path}`, middlewares, handler },
    v2: { path: `/api/v2${path}`, middlewares, handler },
    legacy: { path: `/api${path}`, middlewares, handler }, // For backward compatibility
  };
}

/**
 * Migration status tracker
 */
export const migrationStatus = {
  v1SunsetDate: new Date('2025-12-31'),
  v1CurrentlyDeprecated: true,
  v2CurrentlyStable: true,
  v1EndpointCount: 0,
  v2EndpointCount: 0,

  /**
   * Get time until v1 sunset
   */
  getTimeUntilV1Sunset(): string {
    const now = new Date();
    const diff = this.v1SunsetDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    return `${months} months and ${days % 30} days`;
  },

  /**
   * Get migration percentage (estimated based on breaking changes)
   */
  getMigrationPercentage(): number {
    if (this.v1EndpointCount === 0) return 0;
    return Math.round(((this.v1EndpointCount - this.v2EndpointCount) / this.v1EndpointCount) * 100);
  },
};

/**
 * API Version documentation
 */
export const API_VERSION_DOCS = {
  overview: `
ALWR API Versioning Strategy
============================

The ALWR API supports multiple API versions to ensure backward compatibility
while allowing for improvements and new features.

Current Status:
- v1: DEPRECATED (sunset on ${API_VERSIONS.v1.sunsetDate})
- v2: STABLE (current recommended version)

Version Detection:
The API automatically detects the version from the request path:
- /api/v1/... -> v1
- /api/v2/... -> v2
- /api/... -> v2 (default)

Migration Timeline:
- NOW: v1 deprecated, v2 stable
- 2025-12-31: v1 endpoints will be removed

Migration Guide:
To migrate from v1 to v2:
1. Update all /api/ calls to /api/v2/
2. Check for breaking changes: https://docs.alwr.local/migration/v1-to-v2
3. Test thoroughly
4. Deploy when ready

For questions: support@alwr.local
  `,
};

export default {
  extractVersion,
  versionDetectionMiddleware,
  getVersionInfoEndpoint,
  isVersionDeprecated,
  isVersionStable,
  requireMinimumVersion,
  createVersionedResponse,
  createVersionRoute,
  migrationStatus,
  API_VERSIONS,
  API_VERSION_DOCS,
};
