# Receta Bebesh App Store Privacy Notes

Use this as the starting point for App Store Connect on June 29, 2026, based on the current codebase.

## Tracking

- Does this app track users across apps or websites owned by other companies: `No`

## Data linked to the user

- `Contact Info`
  - Name
  - Email Address
  - Purpose: account creation, sign-in, account management

- `User Content`
  - Profile Photo
  - Meal Plans
  - Shopping List
  - Notes
  - Ratings
  - Favorites
  - Purpose: core app functionality, personalization

- `Sensitive Info` or related profile data entered by the user
  - Baby Name
  - Baby Birthdate
  - Feeding tracker entries
  - Growth tracker entries
  - Purpose: personalized meal planning and baby-profile features

## Data not currently used for tracking

- The app does not include ad tracking SDKs.
- The app does not currently implement third-party advertising.
- Local notifications are used for reminders when enabled by the user.

## Notes

- Firebase Authentication and Firebase Realtime Database are used for account and app data storage.
- Google sign-in may be available depending on platform configuration.
- AI meal-planning requests may send recipe-selection context and baby age stage to Gemini services when that feature is used.

## Review before submitting

Confirm these answers again if you add any of the following before release:

- analytics or crash reporting
- remote push tokens or push campaigns
- ad SDKs
- device identifiers
- new health-related exports
