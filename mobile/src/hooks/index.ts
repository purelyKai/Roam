/**
 * Hooks barrel export
 */

// Hotspots hook (replaces getPins)
export { default as useHotspots } from "./useHotspots";
export {
  formatHotspotPrice,
  calculatePriceCents,
  type Hotspot,
} from "./useHotspots";

// Location watcher
export { useLocationWatcher } from "./useLocationWatcher";

// Auto reconnect
export { default as useAutoReconnect } from "./useAutoReconnect";
