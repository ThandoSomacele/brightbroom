// src/app.d.ts
/// <reference types="lucia" />
declare global {
  namespace App {
    interface Locals {
      auth: import('lucia').Auth;
      session: import('lucia').Session | null;
      user: import('lucia').User | null;
    }
    interface PageData {
      user: import('lucia').User | null;
    }
  }
}

export {};
