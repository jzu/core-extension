import * as Sentry from '@sentry/browser';
import { addExtensionMethods, Integrations } from '@sentry/tracing';
import browser from 'webextension-polyfill';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.RELEASE || 'dev',
    release: `core-extension@${browser.runtime.getManifest().version}`,
    debug: process.env.NODE_ENV === 'development',
    tracesSampleRate: 0.003,
    integrations: [
      /**
       * eliminating dom and history from the breadcrumbs. This should eliminate
       * a massive amount of the daa leaks into sentry. If we find that console
       * is leaking data, suspected that it might, than we can review the leak and
       * see if we cant modify the data before it is recorded. This can be
       * done in the sentry options beforeBreadcrumbs function.
       */
      new Sentry.Integrations.Breadcrumbs({ dom: false, history: false }),
      new Integrations.Express(),
    ],
    ignoreErrors: [/^AbortError: The user aborted a request.$/], // ignore errors caused by chrome's throttling
  });
}
addExtensionMethods();
