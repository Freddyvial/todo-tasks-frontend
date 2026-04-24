import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() debe ejecutarse en el cuerpo de la función (contexto de inyección),
  // NO dentro del callback de catchError (contexto asíncrono fuera de inyección).
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      snackBar.open(resolveMessage(error), 'Cerrar', {
        duration: 5000,
        panelClass: ['snack-error'],
      });
      return throwError(() => error);
    })
  );
};

function resolveMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Verifique su conexión.';
  }

  const serverMessage: string | undefined = error.error?.message;
  if (serverMessage?.trim()) {
    return serverMessage;
  }

  return `Error ${error.status}. Intente de nuevo.`;
}
