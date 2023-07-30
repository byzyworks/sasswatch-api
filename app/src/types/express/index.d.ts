export {};

// For passing between middleware.
declare global {
  namespace Express {
    export interface Request {
      credentials?: {
        id:       number;
        username: string;
        roletype: string;
        password: string;
      }
    }
  }
}
