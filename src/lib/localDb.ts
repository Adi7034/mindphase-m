// Local database using localStorage - replaces all Supabase data operations

const PREFIX = 'mindphase_';

function getKey(table: string): string {
  return `${PREFIX}${table}`;
}

function readTable<T>(table: string): T[] {
  try {
    const raw = localStorage.getItem(getKey(table));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTable<T>(table: string, data: T[]): void {
  localStorage.setItem(getKey(table), JSON.stringify(data));
}

// Generic CRUD operations
export const localDb = {
  // Get all records, optionally filtered
  select<T extends Record<string, any>>(table: string, filters?: Partial<T>): T[] {
    let data = readTable<T>(table);
    if (filters) {
      data = data.filter(item =>
        Object.entries(filters).every(([key, value]) => item[key] === value)
      );
    }
    return data;
  },

  // Insert a record
  insert<T extends Record<string, any>>(table: string, record: T): T {
    const data = readTable<T>(table);
    const newRecord = {
      ...record,
      id: record.id || crypto.randomUUID(),
      created_at: record.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.push(newRecord);
    writeTable(table, data);
    return newRecord;
  },

  // Upsert a record (by matching fields)
  upsert<T extends Record<string, any>>(table: string, record: T, conflictKeys: string[]): T {
    const data = readTable<T>(table);
    const existingIndex = data.findIndex(item =>
      conflictKeys.every(key => item[key] === record[key])
    );

    const newRecord = {
      ...record,
      id: existingIndex >= 0 ? data[existingIndex].id : (record.id || crypto.randomUUID()),
      created_at: existingIndex >= 0 ? data[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      data[existingIndex] = newRecord;
    } else {
      data.push(newRecord);
    }
    writeTable(table, data);
    return newRecord;
  },

  // Update records matching filters
  update<T extends Record<string, any>>(table: string, filters: Partial<T>, updates: Partial<T>): void {
    const data = readTable<T>(table);
    const updated = data.map(item => {
      const matches = Object.entries(filters).every(([key, value]) => item[key] === value);
      if (matches) {
        return { ...item, ...updates, updated_at: new Date().toISOString() };
      }
      return item;
    });
    writeTable(table, updated);
  },

  // Delete records matching filters
  delete<T extends Record<string, any>>(table: string, filters: Partial<T>): void {
    const data = readTable<T>(table);
    const remaining = data.filter(item =>
      !Object.entries(filters).every(([key, value]) => item[key] === value)
    );
    writeTable(table, remaining);
  },

  // Delete records matching id in array
  deleteByIds(table: string, ids: string[]): void {
    const data = readTable<any>(table);
    const remaining = data.filter(item => !ids.includes(item.id));
    writeTable(table, remaining);
  },
};

// Auth-specific localStorage operations
const AUTH_KEY = `${PREFIX}auth`;
const PROFILE_KEY = `${PREFIX}profile`;

export interface LocalUser {
  id: string;
  pin: string; // hashed PIN
  gender: string;
  display_name: string | null;
  created_at: string;
}

// Simple hash for PIN (not cryptographically secure, but fine for local-only)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'mindphase_salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const localAuth = {
  async getUser(): Promise<LocalUser | null> {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn(): boolean {
    return localStorage.getItem(`${PREFIX}session`) === 'active';
  },

  async signUp(pin: string, gender: string, displayName?: string): Promise<LocalUser> {
    const existing = await this.getUser();
    if (existing) throw new Error('Account already exists on this device');

    const hashedPin = await hashPin(pin);
    const user: LocalUser = {
      id: crypto.randomUUID(),
      pin: hashedPin,
      gender,
      display_name: displayName || null,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    localStorage.setItem(`${PREFIX}session`, 'active');
    return user;
  },

  async signIn(pin: string): Promise<LocalUser> {
    const user = await this.getUser();
    if (!user) throw new Error('No account found. Please create one first.');

    const hashedPin = await hashPin(pin);
    if (hashedPin !== user.pin) throw new Error('Incorrect PIN');

    localStorage.setItem(`${PREFIX}session`, 'active');
    return user;
  },

  signOut(): void {
    localStorage.removeItem(`${PREFIX}session`);
  },

  async resetPin(newPin: string): Promise<void> {
    const user = await this.getUser();
    if (!user) throw new Error('No account found');

    user.pin = await hashPin(newPin);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  },

  async updateProfile(updates: Partial<Pick<LocalUser, 'gender' | 'display_name'>>): Promise<void> {
    const user = await this.getUser();
    if (!user) throw new Error('No account found');
    Object.assign(user, updates);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  },
};
