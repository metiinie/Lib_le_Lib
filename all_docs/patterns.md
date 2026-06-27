# Design Patterns

## Repository pattern

Every table has exactly one repository. Services call repositories; nothing else does.
If a service needs a new query, add a method to the repository — don't inline SQL or ORM
calls directly in the service.

## Service layer

Business rules live in services, not controllers, not repositories. A repository should
never contain an `if` that encodes a business rule (e.g. "don't return blocked users") —
that belongs in the service, ideally with a comment pointing back to the relevant line in
`docs/business-rules.md`.

## The Reveal Grant pattern

Visibility for any photo (profile or chat) is never a boolean flag on the photo row
itself. It's a separate, revocable grant (`photo_reveal_grants`, or the message-attachment
equivalent) scoped to a specific viewer and match. To "unreveal" something, delete or
expire the grant — don't bolt an `is_blurred = true` toggle onto the photo row next to
this; that creates two sources of truth for the same thing.

## Isolated module pattern

`verification/` is structured so it could be extracted into its own service with its own
database with minimal change: a narrow public interface, no other module reaching into
its schema. Apply the same discipline if `qa/` (health-professional Q&A) ever needs
similar isolation — sensitive-data modules earn this treatment by default, not by request.

## Consistency over cleverness

If two ways of writing something are both reasonable, pick whichever matches the nearest
existing example in the codebase. A reviewer — human or AI — shouldn't be able to tell
which files were written by whom.
