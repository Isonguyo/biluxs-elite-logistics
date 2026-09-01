# BiLUXS Member Experience Simplification

## Goal
Make the authenticated customer experience immediately understandable on mobile while preserving the current TanStack routes, auth, database access, bookings, payments, QR handling, and realtime architecture.

## Scope
- Simplify `PortalLayout` into a customer-first shell with clear Home access, notification badge, avatar/menu, responsive navigation, and secondary service links.
- Replace the portal overview with five priorities: next ride, assigned chauffeur/tracking state, tier progress, recent rides, and notifications.
- Improve the trip detail experience with human-readable ride progression, live location freshness, driver card, contextual boarding pass modal, and customer-only driver chat/review entry points.
- Add profile photo preview/upload/replace/remove using a private `avatars` storage bucket and secure storage policies; reuse the saved avatar anywhere member identity is displayed.
- Extend notification data where needed for booking context and keep realtime customer-scoped read/mark-all behavior.
- Harden customer messaging/review paths so a customer can only access the conversation for their own booking and can review a completed ride once.
- Add a compact, understandable tier progress model without exposing internal formulas or admin terminology.

## Database / backend
- Inspect existing columns and policies before changes.
- Use a migration for only required notification/review/chat/profile-photo fields or policies, with explicit public-schema grants and RLS ordering.
- Create the dedicated private avatar bucket with the storage tool, then add object policies for owner-scoped upload/update/delete and authenticated read as appropriate.
- Reuse existing `get_booking_driver`, `trip_events`, `driver_lat_lng`, `driver_reviews`, `notifications`, `conversations`, and `messages` functionality.

## Frontend implementation
- Update shared portal navigation and identity components so all member pages show Home, notifications, and the current avatar with initials fallback.
- Add reusable avatar and human-readable ride-status helpers.
- Update profile form with preview, upload progress, remove action, and safe image handling.
- Refactor overview and trip detail pages to reduce density and keep core ride actions above the fold.
- Update messages to support booking-specific chauffeur conversations while preserving support/concierge channels.
- Add completed-trip review UI and prevent duplicate submissions through existing table constraints/policies or a narrowly scoped migration.
- Keep existing routes and link targets; no application rewrite.

## Verification
- Run the project’s existing typecheck/build signal.
- Inspect current build/runtime logs after edits.
- Use a fresh authenticated browser check at `/portal`, `/portal/trips/$id`, `/portal/profile`, `/portal/messages`, and notification interactions where available.
- Confirm no horizontal overflow, broken avatar states, duplicate realtime subscription errors, or new console errors.
