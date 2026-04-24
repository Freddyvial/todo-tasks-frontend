import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { GlobalErrorHandler } from './core/handlers/global-error-handler';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: { verticalPosition: 'top', horizontalPosition: 'end', duration: 4000 },
    },
  ],
};
