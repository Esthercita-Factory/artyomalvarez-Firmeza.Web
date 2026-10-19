import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { LoginResponse } from '@models/models';

const TOKEN_KEY = 'firmeza_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl;

  readonly token = signal<string | null>(this.getStoredToken());

  private decodePayload(rawToken?: string | null): Record<string, unknown> | null {
    const t = rawToken !== undefined ? rawToken : this.token();
    if (!t) return null;
    try {
      const parts = t.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = (4 - (base64.length % 4)) % 4;
      base64 = base64.padEnd(base64.length + pad, '=');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  readonly isLoggedIn = computed<boolean>(() => {
    const t = this.token();
    if (!t) return false;
    const payload = this.decodePayload();
    if (!payload) return false;
    // Check expiration if 'exp' exists
    if (typeof payload['exp'] === 'number') {
      const isExpired = Date.now() >= payload['exp'] * 1000;
      if (isExpired) return false;
    }
    return true;
  });

  readonly role = computed<string | string[] | null>(() => {
    const payload = this.decodePayload();
    if (!payload) return null;
    const r =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      payload['role'];
    return (r as string | string[]) ?? null;
  });

  readonly isAdmin = computed<boolean>(() => {
    const r = this.role();
    if (!r) return false;
    if (Array.isArray(r)) {
      return r.includes('Administrador');
    }
    return r === 'Administrador';
  });

  readonly email = computed<string | null>(() => {
    const payload = this.decodePayload();
    if (!payload) return null;
    const em =
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
      payload['email'];
    return (em as string) ?? null;
  });

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;

    const payload = this.decodePayload(stored);
    if (!payload) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }

    if (typeof payload['exp'] === 'number') {
      const isExpired = Date.now() >= payload['exp'] * 1000;
      if (isExpired) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
    }

    return stored;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/Auth/login`, { email, password })
      .pipe(
        tap((res) => {
          if (res && res.token) {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(TOKEN_KEY, res.token);
            }
            this.token.set(res.token);
          }
        })
      );
  }

  register(email: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/Auth/register`, {
      email,
      password
    });
  }

  clear(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.token.set(null);
  }

  logout(to = '/login'): void {
    this.clear();
    this.router.navigateByUrl(to);
  }
}
