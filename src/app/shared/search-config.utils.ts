import { isValidDate } from '@onecx/accelerator'

import { SearchConfigInfo } from './generated'
import { advancedViewMode, basicViewMode } from './constants'
import { FieldValues, SearchData, UnparsedFieldValues } from './search-config.store'

/**
 * The page aspects compared to decide whether a config is modified (field values, view mode,
 * columns). Every field is optional so a deployment can track a subset of them — aspects the page
 * does not track are skipped rather than compared.
 */
export type SearchConfigPageData = Partial<SearchData>

export function hasValues(config: SearchConfigInfo): boolean {
  return Object.keys(config.values).length > 0
}

export function hasColumns(config: SearchConfigInfo): boolean {
  return config.columns.length > 0
}

export function hasOnlyValues(config: SearchConfigInfo): boolean {
  return !hasColumns(config) && hasValues(config)
}

export function hasOnlyColumns(config: SearchConfigInfo): boolean {
  return !hasValues(config) && hasColumns(config)
}

/**
 * Whether two sets of field values are equal. Empty fields are ignored and the key order does not
 * matter, so a config that stores a field as empty (`{ a: '' }`) equals a page that reports the field
 * as empty or not at all, and configs saved before empty fields were stored still compare correctly.
 */
export function areValuesEqual(v1: FieldValues, v2: FieldValues): boolean {
  const filled = (values: FieldValues) =>
    Object.entries(values)
      .filter(([, value]) => value !== '')
      .sort(([k1], [k2]) => k1.localeCompare(k2))
  return JSON.stringify(filled(v1)) === JSON.stringify(filled(v2))
}

/**
 * Whether a saved config is modified relative to the page's current state. A config is modified when
 * any aspect it stores differs, by value comparison, from the page's current state: the criteria
 * (field values plus view mode) when it stores values, and the displayed columns when it stores
 * columns. Aspects the config does not store are ignored, so a config with only values is never
 * modified by a column change and vice versa.
 *
 * Aspects the page does not track are skipped rather than compared: `fieldValues` is only evaluated
 * when the header remote reports them (a standalone column-group deployment without the header remote
 * never sets them) and the view-mode comparison is only applied when the page reports a view mode,
 * while `displayedColumnsIds` is only evaluated when the column-group remote reports them (a header
 * remote on its own never sets them). This keeps a single-remote deployment from reporting the
 * selected config as permanently modified by aspects the page does not track.
 */
export function isSearchConfigModified(config: SearchConfigInfo | undefined, pageData: SearchConfigPageData): boolean {
  if (config === undefined) return false

  let modified = false
  if (hasValues(config) && pageData.fieldValues !== undefined) {
    modified =
      !areValuesEqual(config.values, pageData.fieldValues) ||
      (pageData.viewMode !== undefined && (config.isAdvanced ? advancedViewMode : basicViewMode) !== pageData.viewMode)
  }
  if (
    hasColumns(config) &&
    pageData.displayedColumnsIds !== undefined &&
    !areColumnsEqual(config.columns, pageData.displayedColumnsIds)
  ) {
    modified = true
  }
  return modified
}

/**
 * Converts the host's field values into stored string values. Every field the host reports is kept;
 * an empty field (any falsy value) is stored as `''`. This keeps "Save search criteria" meaningful when
 * all fields are empty: the config stores the empty search (and is listed in the header), and
 * selecting it clears the fields again.
 */
export function parseFieldValues(values: UnparsedFieldValues): FieldValues {
  return Object.entries(values).reduce(
    (acc: { [key: string]: string }, [key, value]) => ({
      ...acc,
      [key]: toFieldValue(value)
    }),
    {}
  )
}

function toFieldValue(value: unknown): string {
  if (!value) {
    return ''
  }
  if (isValidDate(value)) {
    return value.toISOString()
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value)
  }
  if (Array.isArray(value)) {
    // Multi-value fields keep their comma-separated form.
    return value.map((item) => toFieldValue(item)).join(',')
  }
  // Any other value (e.g. an object from a custom form control) is stored as JSON instead of
  // `[object Object]`.
  return JSON.stringify(value) ?? ''
}

export function areColumnsEqual(c1: Array<string>, c2: Array<string>): boolean {
  return c1.length === c2.length && c1.every((col) => c2.includes(col))
}
