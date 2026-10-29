# UC-US-002 - Password Reset

## Goal

Allow a user who cannot sign in to request a one-time password-reset link and
set a new password.

## Scope

This use case covers requesting a reset email and submitting a new password
using the link. It does not cover changing a password from an authenticated
account settings page or signing the user in after reset.

## Primary Actor

User who needs to reset their password

## Supporting Actors

- My Team frontend (login and reset-password pages)
- Authentication API
- Email delivery service

## Preconditions

- The user can access the public login and password-reset pages.
- The user can access the mailbox associated with the account.

## Trigger

The user selects **Forgot your password?** on the sign-in form.

## Input Data

Request:
- Email address

Reset:
- Email address from the reset link
- Reset token from the reset link
- New password
- Confirmation of the new password

## Main Success Scenario

1. The user opens the reset request form from the sign-in page.
2. The user enters an email address and selects **Send reset link**.
3. The frontend sends `POST /auth/request-reset` with the email address.
4. The API returns the same success message whether or not an account exists,
   to avoid disclosing account existence.
5. If the account exists, the API emails a one-time reset link valid for one
   hour. The link opens `/reset-password?token=…&email=…`.
6. The user opens the link and enters a new password in both password fields.
7. The user submits the form. The frontend requires matching passwords and at
   least six characters.
8. The frontend sends `POST /auth/reset-password` with `email`, `resetToken`,
   and `newPassword`.
9. The API validates the token and updates the account password.
10. The frontend confirms the reset and navigates to sign-in after a short
    delay.
11. The user signs in with the new password using UC-US-003.

## Alternative Flows

### A1 - Unknown Email Address

1. The API finds no account for the submitted email.
2. The API returns the same success message as for a known account and sends no
   email.

### A2 - Passwords Do Not Match or Are Too Short

1. The user submits different confirmation values or a password shorter than
   six characters.
2. The frontend rejects the form without calling the reset endpoint.
3. The user corrects the values and retries.

### A3 - Invalid, Expired, or Used Reset Token

1. The user submits a missing, invalid, expired, or previously used token.
2. The API rejects the reset request and leaves the password unchanged.
3. The frontend displays an error; the user may request another link.

### A4 - Email or API Failure

1. The reset email cannot be sent or an API request fails.
2. The frontend displays an error and allows the user to retry.

## Postconditions

Success:
- The account password is replaced with the new password.
- The reset token is marked as used.
- The user is not signed in automatically.

Failure:
- The account password is unchanged.
- Invalid reset tokens cannot be used to change a password.

## Business Rules

- Reset requests must not reveal whether an email address has an account.
- Passwords must contain at least six characters.
- Reset links expire after one hour and are single-use.
- The reset URL contains both the reset token and URL-encoded email address.

## API Contract Used

- `POST /auth/request-reset` with `{ email }`; success is `200` with a generic
  message.
- `POST /auth/reset-password` with `{ email, resetToken, newPassword }`; success
  is `200` with a confirmation message.
- Invalid input or token returns `400`.

## Acceptance Criteria

1. Given any syntactically valid email address, when a reset is requested, then
   the response does not disclose whether the account exists.
2. Given a known account, when a reset is requested, then a one-hour reset link
   is sent to that account's email address.
3. Given matching passwords of at least six characters and a valid unused
   token, when submitted, then the password changes and the token is consumed.
4. Given mismatched or too-short passwords, then no reset API request is sent.
5. Given an invalid, expired, or used token, then the password remains
   unchanged and the frontend reports failure.
6. Given a successful reset, then the user must sign in with the new password.
