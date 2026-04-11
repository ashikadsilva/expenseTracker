/**
 * @deprecated Use `./persistence` (loadAppData / saveAppData) instead.
 * Kept for backwards compatibility with older imports.
 */
export {
  loadAppData as loadData,
  saveAppData as saveData,
  DEFAULT_CATEGORIES,
  isCloudPersistenceEnabled,
} from './persistence';
