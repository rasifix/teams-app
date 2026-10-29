# UC-US-001 - User Registration

## Goal

Allow a visitor to create a Squadra account and verify ownership of the
provided email address before signing in.

## Scope

This use case covers submitting the registration form, sending and accepting an
email-verification link, and the transition to sign-in. It does not cover
creating a squad or authenticating the user automatically after registration.

## Primary Actor

Unauthenticated visitor

## Supporting Actors

- Squadra frontend (home page, registration form, verification page)
- Authentication API
- Email delivery service

## Preconditions

- The visitor can access the public home and registration pages.
- The visitor has an email address not already registered and can receive mail
  at that address.

## Trigger

The visitor selects **Register** on the home page.

## Input Data

- First name
- Last name
- Email address
- Password (at least 6 characters)

## Main Success Scenario

1. The visitor opens the home page while signed out and selects **Register**.
2. The system displays the account form.
3. The visitor enters the required details and selects **Sign up**.
4. The frontend sends the details to `POST /auth/register`.
5. The API creates an unverified account and sends a verification email. The
   registration response contains the user and a message, but no authentication
   token.
6. The frontend confirms that an email was sent and leaves the visitor signed
   out.
7. The visitor opens the email and follows the verification link to
   `/verify-email?token=…`.
8. The frontend sends the token to `GET /auth/verify-email?token=…`.
9. The API accepts the valid token and marks the email address as verified.
10. The frontend confirms verification and provides a link to sign in.
11. The visitor signs in using UC-US-003.

## Alternative Flows

### A1 - Invalid Registration Data

1. The visitor submits missing or invalid data, or a password shorter than six
   characters.
2. Client-side or API validation rejects the request.
3. The account is not created and the visitor can correct the form.

### A2 - Email Already Registered

1. The API detects an existing account for the email address.
2. The API returns a conflict response.
3. The frontend reports the registration failure; the visitor can sign in
   instead.

### A3 - Missing, Invalid, Expired, or Reused Verification Token

1. The visitor opens a verification URL with a missing, invalid, expired, or
   already-used token.
2. The API rejects verification and the frontend displays an error.
3. The account remains unavailable for sign-in until it is successfully
   verified.

### A4 - Verification Email Delivery Failure

1. The API cannot send the verification message.
2. Registration returns an error; the frontend displays the registration
   failure.

## Postconditions

Success:
- The account exists and its email address is verified.
- No session token is issued by registration or verification.
- The user must complete UC-US-003 to sign in.

Failure:
- Invalid registration does not create an account.
- A created but unverified account cannot sign in.

## Business Rules

- Email addresses are stored and looked up in lowercase by the API.
- Passwords must contain at least six characters.
- The verification link is valid for 24 hours and can be used once.
- Registration does not authenticate the visitor.

## API Contract Used

- `POST /auth/register`: accepts `email`, `password`, and optional
  `firstName`/`lastName`; success is `201` with `user` and `message`, without a
  token.
- `GET /auth/verify-email?token={token}`: verifies the email; invalid, expired,
  or reused tokens return `400`.

## Acceptance Criteria

1. Given valid, unused registration details, when the visitor submits the form,
   then an unverified account is created and a verification email is sent.
2. Given successful registration, then no authentication token is stored and
   the visitor remains signed out.
3. Given a valid verification link, when opened, then the account is verified
   and the visitor is offered a path to sign in.
4. Given an invalid, expired, or reused token, then verification fails and the
   visitor sees an error.
5. Given an already-registered email address, then registration is rejected
   without creating a second account.

## Notes

- The registration form requires first and last name even though the API only
  requires email and password.
- The verification URL is constructed by the backend as
  `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`.
