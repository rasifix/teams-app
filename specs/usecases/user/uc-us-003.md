# UC-US-003 - User Login

## Goal

Authenticate a verified user and establish a session for protected My Team
features.

## Scope

This use case covers signing in, handling authentication failures, and
redirecting to the requested protected page. It does not cover registration
(UC-US-001), password reset (UC-US-002), or account creation.

## Primary Actor

Registered user with a verified email address

## Supporting Actors

- My Team frontend (home page, sign-in form, protected routes)
- Authentication API
- Authentication context and API client

## Preconditions

- The user has an account.
- The account email address is verified.
- The user knows the account email address and password.

## Trigger

The user selects **Login** on the home page or is redirected to sign-in when
opening a protected page without a valid session.

## Input Data

- Email address
- Password

## Main Success Scenario

1. The user opens the sign-in page.
2. The user enters their email address and password and selects **Sign in**.
3. The frontend sends `POST /auth/login` with the credentials.
4. The API verifies the account, email-verification status, and password.
5. The API returns the user and a JWT token.
6. The frontend stores the token and sets the authenticated user in the auth
   context.
7. The frontend navigates to the originally requested protected path, or to
   the home page if there was no prior path.
8. The protected route is available to the authenticated user.

## Alternative Flows

### A1 - Invalid Credentials

1. The email address or password does not match an account.
2. The API returns `401`.
3. The frontend displays an authentication error and keeps the user signed out.

### A2 - Email Not Verified

1. The credentials match an account whose email is not verified.
2. The API returns `403` with an email-verification requirement.
3. The frontend displays the API error and keeps the user signed out.
4. The user completes UC-US-001 by verifying their email, then retries.

### A3 - Session Expired or Protected API Rejects the Token

1. A protected API request detects an absent, expired, or rejected token.
2. The API client clears the stored token and redirects the user to sign-in.
3. After successful sign-in, the user returns to the requested protected path
   when that path was retained by the route guard.

### A4 - API Or Network Failure

1. The login request cannot be completed.
2. The frontend displays an error and leaves the user signed out.

## Postconditions

Success:
- A JWT token is stored in browser local storage.
- The authenticated user is available through the auth context.
- Protected routes can load for the session.

Failure:
- No new authenticated user state is established.
- Invalid or unverified accounts remain signed out.

## Business Rules

- Only verified accounts can sign in.
- The API returns `401` for invalid credentials and `403` for an unverified
  email address.
- The token is attached as a bearer token to protected API requests.
- Logout clears the token and authenticated user state.

## API Contract Used

- `POST /auth/login` with `{ email, password }`.
- Success: `200` with `{ user, token }`.
- Invalid credentials: `401`.
- Email not verified: `403`.

## Acceptance Criteria

1. Given a verified account with valid credentials, when the user signs in,
   then a token is stored and protected content becomes available.
2. Given invalid credentials, when the user submits the form, then sign-in
   fails and no authenticated state is established.
3. Given an unverified account with the correct password, then sign-in is
   rejected and the user remains signed out.
4. Given a user was redirected from a protected route to sign-in, when login
   succeeds, then the app returns to that route.
5. Given the token is expired or rejected on a protected API call, then the
   token is cleared and the user is returned to sign-in.
