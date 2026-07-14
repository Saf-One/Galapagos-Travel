import {CONFIG} from "./config";

// === CONFIGURABLE VALUES ===
// Returns the GA Measurement ID (empty string when not configured).
// The layout renders <GoogleAnalytics> only when this is non-empty, so
// nothing is loaded if analytics are not set up.

export const GA_MEASUREMENT_ID = CONFIG.gaMeasurementId;
export const analyticsEnabled = GA_MEASUREMENT_ID.length > 0;
