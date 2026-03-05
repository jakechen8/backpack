# Backpack — Firestore Data Model (v2, hardened)

## Security changes from v1
- OAuth tokens moved to `sources_credentials` (server-only, never client-readable)
- Items: viewers can only toggle `done`/`doneBy`/`doneAt`, not mutate deadlines
- Invites: locked to owner/parent of the referenced family, max role = `editor`
- Family creation: must set `createdBy` = own uid, required fields enforced
- Member bootstrap: creator can only write their own member doc as `owner`
- Audit log: immutable, owner-readable, server-written
- Provenance/confidence fields added to items for Trust Ledger

## Collection Structure

```
users/{userId}
├── email
├── displayName
├── familyIds[]               ← families they belong to
├── createdAt
└── settings
    ├── timezone              ← e.g. "America/Los_Angeles"
    ├── digestTime            ← "19:00" (7 PM local)
    ├── morningReminder       ← "07:00"
    └── notifications { urgent, digest, allSet }

families/{familyId}
├── name                      ← "The Chen Family"
├── createdBy                 ← uid (enforced in rules)
├── createdAt                 ← serverTimestamp
│
├── /members/{userId}
│   ├── role                  ← "owner" | "parent" | "editor" | "viewer"
│   ├── displayName
│   ├── email
│   └── joinedAt
│
├── /children/{childId}
│   ├── name
│   ├── nickname              ← optional
│   ├── grade
│   ├── school
│   ├── teacher
│   └── color                 ← hex, assigned on creation
│
├── /sources/{sourceId}
│   │  *** PUBLIC metadata only — no tokens ***
│   ├── type                  ← "gmail" | "outlook" | "parentsquare" | "manual"
│   ├── email                 ← sender address or account display
│   ├── label                 ← "Mrs. Rodriguez"
│   ├── childId               ← optional, maps source to one child
│   ├── status                ← "active" | "error" | "disconnected"
│   ├── lastSyncAt
│   └── lastError             ← null or error message
│
├── /sources_credentials/{sourceId}
│   │  *** SERVER-ONLY — rules: read:false, write:false ***
│   ├── accessToken           ← encrypted at rest (Cloud KMS)
│   ├── refreshToken          ← encrypted at rest
│   ├── tokenExpiry           ← timestamp
│   └── encryptionKeyRef      ← KMS key reference
│
├── /messages/{messageId}
│   ├── sourceId
│   ├── externalId            ← Gmail message ID for deduplication
│   ├── from
│   ├── subject
│   ├── bodyText              ← plain text (extracted)
│   ├── childId               ← resolved child id, or "all"
│   ├── labels[]              ← ["bring", "schedule", "money"]
│   ├── read                  ← boolean
│   ├── createdAt
│   └── extractedFacts[]      ← [{ type, text, confidence }]
│
├── /items/{itemId}
│   │  *** THE CORE: tasks, bring-items, events, payments ***
│   ├── type                  ← "bring" | "sign" | "pay" | "wear" | "event" | "task"
│   ├── text                  ← "Library book — Matilda"
│   ├── childId
│   ├── date                  ← YYYY-MM-DD (which day)
│   ├── time                  ← HH:mm (optional, for events)
│   ├── urgent                ← boolean
│   ├── done                  ← boolean
│   ├── doneBy                ← userId
│   ├── doneAt                ← timestamp
│   ├── amount                ← for payments (string, e.g. "$10")
│   ├── link                  ← external URL (form, payment page)
│   │
│   │  *** PROVENANCE (Trust Ledger) ***
│   ├── sourceMessageId       ← which message created this
│   ├── sourceText            ← human-readable, e.g. "Mrs. Rodriguez, Feb 28"
│   ├── confidence            ← 0.0–1.0, extraction confidence
│   ├── confirmedByUser       ← boolean (user verified this is correct)
│   ├── extractionMethod      ← "regex" | "classifier" | "llm"
│   │
│   ├── createdAt
│   └── updatedAt
│
├── /files/{fileId}
│   ├── name                  ← "Science Museum Permission Slip"
│   ├── storagePath           ← Firebase Storage path
│   ├── mimeType
│   ├── sizeBytes
│   ├── childId
│   ├── sourceMessageId
│   ├── sourceName            ← "Newsletter"
│   ├── needsSignature        ← boolean
│   ├── signed                ← boolean
│   └── createdAt
│
└── /audit/{logId}
    │  *** IMMUTABLE COMPLIANCE LOG ***
    ├── action                ← "item.created" | "item.done" | "member.added" | "data.exported" | "data.deleted"
    ├── actorId               ← userId or "system"
    ├── targetType            ← "item" | "member" | "message" | "file"
    ├── targetId
    ├── metadata {}           ← action-specific details
    └── timestamp

invites/{inviteId}
├── familyId
├── email
├── role                      ← max "editor" (cannot invite as owner)
├── invitedBy                 ← uid (enforced = request.auth.uid)
└── createdAt
```

## Indexes

See `firestore/indexes.json`. Key queries:
- Items by date + urgency (Today view)
- Items by childId + date (per-child filtering)
- Messages by createdAt desc (Inbox)
- Audit by timestamp desc (compliance review)
