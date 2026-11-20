// Proxy location for nested proxy-host locations
export interface ProxyLocation {
  id?: number;
  path: string;
  forward_scheme: string;
  forward_host: string;
  forward_port: number;
  forward_path: string;
  advanced_config: string;
  access_list_id: number;
}

// Proxy host response
export interface ProxyHost {
  id: number;
  created_on: string;
  modified_on: string;
  owner_user_id: number;
  domain_names: string[];
  forward_scheme: string;
  forward_host: string;
  forward_port: number;
  access_list_id: number;
  certificate_id: number;
  ssl_forced: boolean;
  caching_enabled: boolean;
  block_exploits: boolean;
  advanced_config: string;
  meta: Record<string, unknown>;
  allow_websocket_upgrade: boolean;
  http2_support: boolean;
  enabled: boolean;
  locations: ProxyLocation[] | null;
  hsts_enabled: boolean;
  hsts_subdomains: boolean;
  trust_forwarded_proto: boolean;
  certificate: unknown;
  owner: unknown;
  access_list: unknown;
}

// Redirection host response
export interface RedirectionHost {
  id: number;
  created_on: string;
  modified_on: string;
  owner_user_id: number;
  domain_names: string[];
  forward_http_code: number;
  forward_scheme: string;
  forward_domain_name: string;
  preserve_path: boolean;
  certificate_id: number;
  ssl_forced: boolean;
  block_exploits: boolean;
  advanced_config: string;
  meta: Record<string, unknown>;
  http2_support: boolean;
  enabled: boolean;
  hsts_enabled: boolean;
  hsts_subdomains: boolean;
  certificate: unknown;
  owner: unknown;
}

// Certificate response
export interface Certificate {
  id: number;
  created_on: string;
  modified_on: string;
  owner_user_id: number;
  provider: string;
  nice_name: string;
  domain_names: string[];
  expires_on: string;
  meta: Record<string, unknown>;
  owner: unknown;
}

// Auth token response
export interface AuthToken {
  token: string;
  expires: string;
}

// 2FA challenge response
export interface TwoFAResponse {
  requires_2fa: boolean;
  challenge_token?: string;
}

// NPM error envelope
export interface NpmError {
  error: {
    code: number;
    message: string;
  };
}
