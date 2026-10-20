export function isPasswordHash(value: string): boolean;
export function hashPassword(password: string): Promise<string>;
export function verifyPassword(password: string, encoded: string): Promise<boolean>;
