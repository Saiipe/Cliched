import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

interface RefreshResponse {
  readonly access: string;
}

function withAuth(request: HttpRequest<unknown>, access: string): HttpRequest<unknown> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${access}` } });
}

/** Anexa o access token nas chamadas à API e, quando ele expira (401),
 * tenta renovar com o refresh token uma única vez antes de desistir. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const storage = inject(TokenStorageService);
  // HttpBackend pula os interceptors, evitando loop 401→refresh→401→refresh...
  const rawHttp = new HttpClient(inject(HttpBackend));

  const isApiCall = request.url.startsWith(environment.apiBaseUrl);
  const isAuthEndpoint = request.url.includes('/api/v1/auth/');
  const access = storage.access();

  if (!isApiCall || !access) {
    return next(request);
  }

  return next(withAuth(request, access)).pipe(
    catchError((error: HttpErrorResponse) => {
      const refresh = storage.refresh();
      if (error.status !== 401 || isAuthEndpoint || !refresh) {
        return throwError(() => error);
      }

      return rawHttp
        .post<RefreshResponse>(`${environment.apiBaseUrl}/api/v1/auth/refresh/`, { refresh })
        .pipe(
          map((tokens) => {
            storage.store({ access: tokens.access });
            return tokens.access;
          }),
          catchError(() => {
            storage.clear(); // refresh também expirou: a sessão acabou de fato
            return throwError(() => error);
          }),
          switchMap((newAccess) => next(withAuth(request, newAccess))),
        );
    }),
  );
};
