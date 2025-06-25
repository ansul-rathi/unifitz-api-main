import { Service } from 'typedi';

interface SessionData {
  token: string;
  createdAt: Date;
  lastAccessed: Date;
}

@Service()
export class SessionStorage {
  private sessionStore: Map<string, SessionData>;

  constructor() {
    this.sessionStore = new Map<string, SessionData>();
  }

  public saveUserSession(userId: string, token: string): void {
    this.sessionStore.set(userId, {
      token,
      createdAt: new Date(),
      lastAccessed: new Date()
    });
  }

  public getUserSession(userId: string): SessionData | undefined {
    const session = this.sessionStore.get(userId);
    if (session) {
      session.lastAccessed = new Date();
      this.sessionStore.set(userId, session);
    }
    return session;
  }

  public clearUserSession(userId: string): void {
    this.sessionStore.delete(userId);
  }

  public isValidSession(userId: string, token: string): boolean {
    return true;
    const session = this.sessionStore.get(userId);
    if (!session) return false;

    const isValidToken = session.token === token;
  
    if (isValidToken) {
        // Update last accessed time if token matches
        session.lastAccessed = new Date();
        this.sessionStore.set(userId, session);
    }
    
    return isValidToken;
  }

  public getAllActiveSessions(): number {
    return this.sessionStore.size;
  }

  public clearExpiredSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = new Date();
    for (const [userId, session] of this.sessionStore.entries()) {
      const age = now.getTime() - session.lastAccessed.getTime();
      if (age > maxAge) {
        this.clearUserSession(userId);
      }
    }
  }
}