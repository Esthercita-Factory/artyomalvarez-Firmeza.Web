import { HttpErrorResponse } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';

export interface Loader<T> {
  data: WritableSignal<T>;
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  reload: () => void;
}

export function errMsg(e: unknown): string {
  if (!(e instanceof HttpErrorResponse)) {
    if (e && typeof e === 'object' && 'message' in e) {
      return String((e as { message: unknown }).message);
    }
    return 'Ocurrió un error inesperado.';
  }

  if (e.status === 0) {
    return 'No se pudo conectar con la API (¿está corriendo? ¿CORS?).';
  }
  if (e.status === 401) {
    return 'Sesión no válida o expirada. Por favor inicie sesión nuevamente.';
  }
  if (e.status === 403) {
    return 'No tiene permisos para realizar esta acción (requiere rol Administrador).';
  }
  if (e.status === 404) {
    return 'El recurso o endpoint solicitado no existe.';
  }

  const errObj = e.error;
  if (errObj && typeof errObj === 'object') {
    // ProblemDetails with validation 'errors'
    if ('errors' in errObj && errObj.errors && typeof errObj.errors === 'object') {
      const messages: string[] = [];
      for (const val of Object.values(errObj.errors)) {
        if (Array.isArray(val)) {
          messages.push(...val.map(String));
        } else if (typeof val === 'string') {
          messages.push(val);
        }
      }
      if (messages.length > 0) {
        return messages.slice(0, 3).join(' · ');
      }
    }

    if ('message' in errObj && typeof errObj.message === 'string' && errObj.message) {
      return errObj.message;
    }
    if ('detail' in errObj && typeof errObj.detail === 'string' && errObj.detail) {
      return errObj.detail;
    }
    if ('title' in errObj && typeof errObj.title === 'string' && errObj.title) {
      return errObj.title;
    }
  }

  return `Error ${e.status}: ${e.statusText || 'Ocurrió un error al procesar la solicitud'}`;
}

export function createLoader<T>(fn: () => Observable<T>, initial: T): Loader<T> {
  const data = signal<T>(initial);
  const loading = signal<boolean>(true);
  const error = signal<string | null>(null);

  const execute = () => {
    loading.set(true);
    error.set(null);
    fn().subscribe({
      next: (val) => {
        data.set(val);
        loading.set(false);
      },
      error: (err) => {
        error.set(errMsg(err));
        loading.set(false);
      }
    });
  };

  execute();

  return {
    data,
    loading,
    error,
    reload: execute
  };
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
