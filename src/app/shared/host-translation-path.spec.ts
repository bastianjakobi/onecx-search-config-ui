import { TestBed } from '@angular/core/testing'
import { Observable, Subject, firstValueFrom } from 'rxjs'

import { AppStateService } from '@onecx/angular-integration-interface'
import { TRANSLATION_PATH } from '@onecx/angular-utils'

import {
  HOST_TRANSLATION_PATH_TIMEOUT,
  hostTranslationPath,
  ownTranslationPath,
  provideHostTranslationPath
} from './host-translation-path'

type MfeStub = { remoteBaseUrl?: string } | undefined

function appStateServiceStub(currentMfe$: Subject<MfeStub>): AppStateService {
  return { currentMfe$: { asObservable: () => currentMfe$.asObservable() } } as unknown as AppStateService
}

describe('hostTranslationPath', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('should resolve the host translation folder when the shell publishes the current MFE', async () => {
    const currentMfe$ = new Subject<MfeStub>()
    const path = firstValueFrom(hostTranslationPath(appStateServiceStub(currentMfe$), 'fallback/'))

    currentMfe$.next({ remoteBaseUrl: '/mfe/tenant/' })

    await expect(path).resolves.toBe('/mfe/tenant/assets/i18n/')
  })

  it('should fall back to the given path when the current MFE has no remote base url', async () => {
    const currentMfe$ = new Subject<MfeStub>()
    const path = firstValueFrom(hostTranslationPath(appStateServiceStub(currentMfe$), 'fallback/'))

    currentMfe$.next({})

    await expect(path).resolves.toBe('fallback/')
  })

  it('should fall back to the given path when no current MFE is published in time', async () => {
    jest.useFakeTimers()
    const currentMfe$ = new Subject<MfeStub>()
    const path = firstValueFrom(hostTranslationPath(appStateServiceStub(currentMfe$), 'fallback/'))

    jest.advanceTimersByTime(HOST_TRANSLATION_PATH_TIMEOUT)

    await expect(path).resolves.toBe('fallback/')
  })
})

describe('provideHostTranslationPath', () => {
  it('should add the host translation folder as a TRANSLATION_PATH when provided', async () => {
    const currentMfe$ = new Subject<MfeStub>()
    TestBed.configureTestingModule({
      providers: [
        { provide: AppStateService, useValue: appStateServiceStub(currentMfe$) },
        provideHostTranslationPath('fallback/')
      ]
    })

    const paths = TestBed.inject(TRANSLATION_PATH) as Observable<string>[]
    expect(paths).toHaveLength(1)

    const path = firstValueFrom(paths[0])
    currentMfe$.next({ remoteBaseUrl: '/mfe/tenant/' })
    await expect(path).resolves.toBe('/mfe/tenant/assets/i18n/')
  })
})

describe('ownTranslationPath', () => {
  it('should return the relative translation folder when no url is given', () => {
    expect(ownTranslationPath(undefined)).toBe('assets/i18n/')
  })

  it('should return the relative translation folder when the url is a local file', () => {
    expect(ownTranslationPath('file:///app/bootstrap.js')).toBe('assets/i18n/')
  })

  it('should return the translation folder next to the bundle when the url is a remote url', () => {
    expect(ownTranslationPath('http://onecx.localhost/mfe/search-config/bootstrap.js')).toBe(
      'http://onecx.localhost/mfe/search-config/assets/i18n/'
    )
  })
})
