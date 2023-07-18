export {};

// For passing between middleware.
declare global {
  namespace Express {
    export interface Request {
      credentials?: {
        username: string;
        roletype: string;
        password: string;
      }
    }
  }
}
