import { Agent } from 'undici';
import { NpmConfig, InstanceConfig } from '../config/types.js';
import { NpmApiException } from './errors.js';
import type {
  AuthToken,
  TwoFAResponse,
  NpmError,
  ProxyHost,
  RedirectionHost,
  Certificate,
} from './types.js';

// Reusable dispatcher for self-signed cert support
const dispatcher = new Agent({
  connect: { rejectUnauthorized: false },
});

interface TokenCache {
  token: string;
  expires: Date;
}

export class NpmClient {
  private readonly apiBase: string;
  private readonly username: string;
  private readonly password: string;
  private tokenCache: TokenCache | null = null;

  constructor(config: InstanceConfig) {
    this.apiBase = config.address.replace(/\/+$/, '') + '/api';
    this.username = config.username;
    this.password = config.password;
  }

  /** Ensure we have a valid token, refreshing if needed. */
  private async ensureToken(): Promise<void> {
    if (this.tokenCache) {
      const now = new Date();
      if (now.getTime() < this.tokenCache.expires.getTime() - 60_000) {
        return; // Token valid for >60s
      }
    }
    await this.refreshToken();
  }

  /** Authenticate or refresh token via NPM API. */
  private async refreshToken(): Promise<void> {
    const body = JSON.stringify({
      identity: this.username,
      secret: this.password,
    });

    const resp = await this.fetchRaw('/tokens', 'POST', body, false);

    if (resp.status !== 200) {
      // Not a successful auth attempt — throw NpmApiException
      await this.throwNpmException(resp);
    }

    const data = (await resp.json()) as TwoFAResponse | AuthToken;

    if ('requires_2fa' in data && data.requires_2fa) {
      throw new Error(
        '2FA enabled on this instance; cannot authenticate automatically. Provide a pre-existing JWT via the client directly.'
      );
    }

    const tokenData = data as AuthToken;
    const expires = new Date(tokenData.expires);
    this.tokenCache = { token: tokenData.token, expires };
  }

  // ─── HTTP verb methods ───

  async get<T>(path: string): Promise<T> {
    return this.send<T>('GET', path, null);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.send<T>('POST', path, body);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.send<T>('PUT', path, body);
  }

  async delete(path: string): Promise<void> {
    await this.send<void>('DELETE', path, null);
  }

  // ─── Core request dispatch ───

  private async send<T>(method: string, path: string, body: unknown): Promise<T> {
    let attempts = 0;
    const maxAttempts = 3; // auth retry + 5xx retry

    while (attempts < maxAttempts) {
      await this.ensureToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${this.tokenCache!.token}`,
      };

      const bodyStr = body !== null && body !== undefined ? JSON.stringify(body) : undefined;

      let resp = await this.fetchRaw(path, method, bodyStr, true);

      // 401/403 → re-auth and retry once
      if ((resp.status === 401 || resp.status === 403) && attempts === 0) {
        await this.refreshToken();
        attempts++;
        continue;
      }

      // 5xx → retry once with delay
      if (resp.status >= 500 && attempts === 1) {
        const { promise, resolve } = Promise.withResolvers<void>();
        setTimeout(resolve, 200);
        await promise;
        attempts++;
        continue;
      }

      if (!resp.ok) {
        await this.throwNpmException(resp);
      }

      const result = (await resp.json()) as T;
      return result;
    }

    // Should not reach here, but just in case
    throw new Error('NPM request exceeded maximum retry attempts');
  }

  // ─── Raw fetch ───

  private async fetchRaw(
    path: string,
    method: string,
    body: string | undefined,
    authenticated: boolean
  ): Promise<Response> {
    const url = this.apiBase + path;
    const headers: Record<string, string> = {};

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (authenticated && this.tokenCache) {
      headers['Authorization'] = `Bearer ${this.tokenCache.token}`;
      headers['Accept'] = 'application/json';
    }

    const init: Record<string, unknown> = {
      method,
      headers,
    };
    if (body !== undefined) {
      init.body = body;
    }
    // Node.js fetch extension: dispatcher for custom agents (undici)
    init.dispatcher = dispatcher;

    return fetch(url, init as RequestInit);
  }

  // ─── Error handling ───

  private async throwNpmException(resp: Response): Promise<never> {
    let message = `HTTP ${resp.status}`;
    try {
      const errBody = (await resp.json()) as NpmError;
      if (errBody.error) {
        message = `NPM API error ${errBody.error.code}: ${errBody.error.message}`;
      }
    } catch {
      // Use status text as fallback
      message = `HTTP ${resp.status}: ${resp.statusText}`;
    }
    throw new NpmApiException(resp.status, message);
  }
}
