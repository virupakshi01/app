export interface AuthenticatedUser {
  id: string;
  githubId: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
