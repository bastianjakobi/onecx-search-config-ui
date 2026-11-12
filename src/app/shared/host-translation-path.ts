import { Location } from '@angular/common'
import { Provider } from '@angular/core'
import { Observable, first, map, of, timeout } from 'rxjs'

import { AppStateService } from '@onecx/angular-integration-interface'
import { TRANSLATION_PATH } from '@onecx/angular-utils'

/** How long to wait for the shell to publish the current MFE before falling back. */
export const HOST_TRANSLATION_PATH_TIMEOUT = 2000

/**
 * Resolves the translation folder of the host MFE that embeds the remote (`<remoteBaseUrl>assets/i18n/`).
 *
 * The host passes some texts as its own i18n keys, e.g. the predefined column group keys and the
 * placeholder of the column-group selector (`TENANT_SEARCH.PREDEFINED_GROUP.DEFAULT`). The remote's
 * own translations cannot know them, so the host's translation files are loaded as well. When no
 * current MFE is published (for example when the remote runs standalone), the remote's own
 * translation path is used instead, which the translate loader de-duplicates.
 */
export function hostTranslationPath(appStateService: AppStateService, fallbackPath: string): Observable<string> {
  return appStateService.currentMfe$.asObservable().pipe(
    first(),
    map((mfe) => (mfe?.remoteBaseUrl ? Location.joinWithSlash(mfe.remoteBaseUrl, 'assets/i18n/') : fallbackPath)),
    timeout({ first: HOST_TRANSLATION_PATH_TIMEOUT, with: () => of(fallbackPath) })
  )
}

/**
 * Provides the host MFE's translation folder as an additional `TRANSLATION_PATH`. Register it *before*
 * the remote's own translation path: the translate loader merges the files in order, so the remote's
 * own texts win when a key exists in both.
 */
export function provideHostTranslationPath(fallbackPath: string): Provider {
  return {
    provide: TRANSLATION_PATH,
    useFactory: (appStateService: AppStateService) => hostTranslationPath(appStateService, fallbackPath),
    deps: [AppStateService],
    multi: true
  }
}

/**
 * The remote's own translation folder derived from its bundle url (the same value
 * `provideTranslationPathFromMeta(url, 'assets/i18n/')` provides), or the relative `assets/i18n/` when
 * the url is not available (unit tests).
 */
export function ownTranslationPath(translationUrl: string | undefined): string {
  if (!translationUrl || translationUrl.startsWith('file://')) {
    return 'assets/i18n/'
  }
  return Location.joinWithSlash(translationUrl.replace(/\/[^/]*$/, ''), 'assets/i18n/')
}
