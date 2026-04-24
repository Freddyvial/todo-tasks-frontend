import { ErrorHandler, inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly snackBar = inject(MatSnackBar);

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);

    // Los errores HTTP ya son manejados por errorInterceptor (snackbar + throwError).
    // Si se llegase a este handler con un HttpErrorResponse es porque el observable
    // no tenía un handler de error propio; el interceptor ya mostró la snackbar,
    // así que solo se registra en consola y no se duplica el mensaje.
    if (error instanceof HttpErrorResponse) {
      return;
    }

    this.snackBar.open(
      'Ocurrió un error inesperado en la aplicación.',
      'Cerrar',
      { duration: 5000, panelClass: ['snack-error'] }
    );
  }
}
