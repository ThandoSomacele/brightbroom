# Authentication Flow

BrightBroom uses Lucia Auth for authentication, as it's designed to work seamlessly with SvelteKit.

## Setup

```typescript
// src/lib/server/auth.ts
import { lucia } from "lucia";
import { sveltekit } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

// Expected by Lucia
declare global {
  namespace Lucia {
    type Auth = typeof auth;
    type DatabaseUserAttributes = {
      email: string;
      firstName: string;
      lastName: string;
      role: "CUSTOMER" | "CLEANER" | "ADMIN";
    };
    type DatabaseSessionAttributes = {};
  }
}

export const auth = lucia({
  env: import.meta.env.DEV ? "DEV" : "PROD",
  middleware: sveltekit(),
  adapter: prisma(client),
  
  getUserAttributes: (data) => {
    return {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role
    };
  }
});

export type Auth = typeof auth;
```

## Authentication Processes

### Registration

1. **User Input Validation**:
   - Validate email, password, names using Zod schemas
   - Check for existing email addresses

2. **Account Creation**:
   - Hash password using Lucia's built-in methods
   - Create user record in database
   - Generate session token

3. **Session Handling**:
   - Set session cookie
   - Redirect to onboarding or dashboard

```typescript
// src/routes/auth/register/+page.server.ts
import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    
    try {
      // Validate form data
      const parsedData = registerSchema.parse({
        email, password, firstName, lastName
      });
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: parsedData.email }
      });
      
      if (existingUser) {
        return fail(400, { message: 'Email already in use' });
      }
      
      // Create new user
      const user = await prisma.user.create({
        data: {
          email: parsedData.email,
          passwordHash: '', // This will be set by Lucia
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          role: 'CUSTOMER'
        }
      });
      
      // Create user in Lucia and get session
      const session = await auth.createUser({
        userId: user.id,
        key: {
          type: 'email',
          providerId: 'email',
          providerUserId: parsedData.email,
          password: parsedData.password
        },
        attributes: {
          email: parsedData.email,
          firstName: parsedData.firstName,
          lastName: parsedData.lastName,
          role: 'CUSTOMER'
        }
      });
      
      // Set session cookie
      const sessionCookie = auth.createSessionCookie(session.id);
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });
      
      // Redirect to dashboard
      throw redirect(302, '/dashboard');
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return fail(400, { 
          message: 'Invalid input', 
          errors: error.flatten().fieldErrors 
        });
      }
      
      // Handle other errors
      return fail(500, { message: 'Failed to create account' });
    }
  }
};
```

### Login

1. **Credential Validation**:
   - Validate email and password
   - Verify against stored credentials

2. **Session Creation**:
   - Generate new session
   - Set session cookie
   - Redirect to dashboard

```typescript
// src/routes/auth/login/+page.server.ts
import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
      // Validate form data
      loginSchema.parse({ email, password });
      
      // Attempt to verify password and get session
      const key = await auth.useKey('email', email.toString(), password.toString());
      const session = await auth.createSession({
        userId: key.userId,
        attributes: {}
      });
      
      // Set session cookie
      const sessionCookie = auth.createSessionCookie(session.id);
      cookies.set(sessionCookie.name, sessionCookie.value, {
        path: '.',
        ...sessionCookie.attributes
      });
      
      // Redirect to dashboard
      throw redirect(302, '/dashboard');
    } catch (error) {
      // Handle login failures
      return fail(400, { message: 'Invalid email or password' });
    }
  }
};
```

### Password Reset

1. **Reset Request**:
   - Generate one-time token
   - Store token with expiration
   - Send reset email

2. **Token Verification**:
   - Validate token against stored value
   - Check token expiration

3. **Password Update**:
   - Update password hash
   - Invalidate token
   - Notify user of success

## Auth Middleware

SvelteKit hooks are used to validate sessions and protect routes:

```typescript
// src/hooks.server.ts
import { auth } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Attach auth to event.locals
  event.locals.auth = auth.handleRequest(event);
  
  // Get session and user
  const session = await event.locals.auth.validate();
  
  // Check protected routes
  if (event.url.pathname.startsWith('/profile') || 
      event.url.pathname.startsWith('/book')) {
    if (!session) {
      throw redirect(302, `/auth/login?redirectTo=${event.url.pathname}`);
    }
  }
  
  // Admin routes protection
  if (event.url.pathname.startsWith('/admin')) {
    if (!session || session.user.role !== 'ADMIN') {
      throw redirect(302, '/auth/login');
    }
  }
  
  // Cleaner routes protection
  if (event.url.pathname.startsWith('/cleaner')) {
    if (!session || session.user.role !== 'CLEANER') {
      throw redirect(302, '/auth/login');
    }
  }
  
  return resolve(event);
};
```

## Logout

```typescript
// src/routes/auth/logout/+page.server.ts
import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ locals }) => {
    const session = await locals.auth.validate();
    
    if (!session) {
      throw redirect(302, '/auth/login');
    }
    
    // Invalidate session
    await auth.invalidateSession(session.id);
    
    // Remove cookie
    const sessionCookie = auth.createSessionCookie(null);
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });
    
    // Redirect to home
    throw redirect(302, '/');
  }
};
```

## Role-Based Access Control

BrightBroom implements role-based access control for different user types:

1. **Customer**: Regular users who book cleaning services
2. **Cleaner**: Service providers who perform cleaning jobs
3. **Admin**: System administrators who manage the platform

Access control is enforced at multiple levels:
- Route protection using SvelteKit hooks
- UI components that adapt based on user role
- API endpoint access control
- Database query filtering based on user permissions
