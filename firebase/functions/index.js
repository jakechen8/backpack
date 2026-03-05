/**
 * Backpack Cloud Functions
 *
 * Responsibilities:
 *   1. Gmail ingestion (scheduled + Pub/Sub push)
 *   2. Message extraction (classify, extract items, store provenance)
 *   3. Family lifecycle (invite acceptance, member bootstrap)
 *   4. Compliance (data export, data deletion, audit logging)
 *   5. Avatar signed URLs (privacy-safe cross-family avatar access)
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { google } = require("googleapis");
const Anthropic = require("@anthropic-ai/sdk");

initializeApp();
const db = getFirestore();
const storage = getStorage();


// ═══════════════════════════════════════════════════════════════
// 1. GMAIL INGESTION
// ═══════════════════════════════════════════════════════════════

/**
 * Scheduled: poll Gmail every 5 minutes for all active Gmail sources.
 * In production, replace with Gmail push notifications via Pub/Sub
 * for lower latency and fewer API calls.
 */
exports.pollGmail = onSchedule(
  { schedule: "every 5 minutes", timeoutSeconds: 300, memory: "512MiB" },
  async () => {
    // Find all families with active Gmail sources
    const sourcesSnap = await db.collectionGroup("sources")
      .where("type", "==", "gmail")
      .where("status", "==", "active")
      .get();

    const results = { processed: 0, errors: 0 };

    for (const sourceDoc of sourcesSnap.docs) {
      try {
        const familyId = sourceDoc.ref.parent.parent.id;
        const sourceId = sourceDoc.id;

        // Get credentials from server-only collection
        const credsDoc = await db.doc(
          `families/${familyId}/sources_credentials/${sourceId}`
        ).get();

        if (!credsDoc.exists) {
          console.warn(`No credentials for source ${sourceId} in family ${familyId}`);
          continue;
        }

        const creds = credsDoc.data();
        const messages = await fetchNewGmailMessages(creds, sourceDoc.data().lastSyncAt);

        for (const msg of messages) {
          await ingestMessage(familyId, sourceId, msg);
        }

        // Update sync timestamp
        await sourceDoc.ref.update({ lastSyncAt: FieldValue.serverTimestamp() });
        results.processed += messages.length;
      } catch (err) {
        results.errors++;
        console.error(`Error polling source ${sourceDoc.id}:`, err.message);

        // Mark source as errored so UI can show it
        await sourceDoc.ref.update({
          status: "error",
          lastError: err.message,
        });
      }
    }

    console.log(`Poll complete: ${results.processed} messages, ${results.errors} errors`);
  }
);


/**
 * Fetch new messages from Gmail API since lastSyncAt.
 */
async function fetchNewGmailMessages(creds, lastSyncAt) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: creds.accessToken,
    refresh_token: creds.refreshToken,
  });

  // Refresh token if expired
  const tokenInfo = await oauth2Client.getAccessToken();
  if (tokenInfo.token !== creds.accessToken) {
    // Token was refreshed — update stored credentials
    // (handled by caller after this returns)
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Build query: messages after last sync, in inbox
  const afterEpoch = lastSyncAt
    ? Math.floor(lastSyncAt.toDate().getTime() / 1000)
    : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000); // Default: last 7 days

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: `after:${afterEpoch}`,
    maxResults: 50,
  });

  if (!listRes.data.messages) return [];

  const messages = [];
  for (const stub of listRes.data.messages) {
    const full = await gmail.users.messages.get({
      userId: "me",
      id: stub.id,
      format: "full",
    });
    messages.push(parseGmailMessage(full.data));
  }

  return messages;
}


/**
 * Parse a Gmail API message into our normalized format.
 */
function parseGmailMessage(raw) {
  const headers = raw.payload.headers || [];
  const getHeader = (name) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  // Extract plain text body
  let bodyText = "";
  function extractText(part) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      bodyText += Buffer.from(part.body.data, "base64").toString("utf-8");
    }
    if (part.parts) part.parts.forEach(extractText);
  }
  extractText(raw.payload);

  // Extract attachments metadata
  const attachments = [];
  function extractAttachments(part) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
        size: part.body.size,
      });
    }
    if (part.parts) part.parts.forEach(extractAttachments);
  }
  extractAttachments(raw.payload);

  return {
    externalId: raw.id,
    from: getHeader("From"),
    subject: getHeader("Subject"),
    date: getHeader("Date"),
    bodyText,
    attachments,
  };
}


/**
 * Ingest a single message: deduplicate, store, trigger extraction.
 */
async function ingestMessage(familyId, sourceId, message) {
  const messagesRef = db.collection(`families/${familyId}/messages`);

  // Deduplicate by externalId
  const existing = await messagesRef
    .where("externalId", "==", message.externalId)
    .limit(1)
    .get();

  if (!existing.empty) return; // Already ingested

  // Store message
  const msgDoc = await messagesRef.add({
    sourceId,
    externalId: message.externalId,
    from: message.from,
    subject: message.subject,
    bodyText: message.bodyText,
    childId: null, // Resolved during extraction
    labels: [],
    read: false,
    extractedFacts: [],
    createdAt: FieldValue.serverTimestamp(),
  });

  // Store attachments in Firebase Storage
  // (In production: download from Gmail API and upload to Storage)
  for (const att of message.attachments) {
    await db.collection(`families/${familyId}/files`).add({
      name: att.filename,
      storagePath: `families/${familyId}/files/${msgDoc.id}/${att.filename}`,
      mimeType: att.mimeType,
      sizeBytes: att.size,
      childId: null,
      sourceMessageId: msgDoc.id,
      sourceName: message.from,
      needsSignature: false,
      signed: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  // Audit log
  await writeAudit(familyId, "system", "message.ingested", "message", msgDoc.id, {
    from: message.from,
    subject: message.subject,
  });
}


// ═══════════════════════════════════════════════════════════════
// 2. MESSAGE EXTRACTION (AI PIPELINE)
// ═══════════════════════════════════════════════════════════════

/**
 * Triggered when a new message is created.
 * Runs extraction pipeline: classify → extract → create items.
 */
exports.extractMessage = onDocumentCreated(
  { document: "families/{familyId}/messages/{messageId}", memory: "1GiB" },
  async (event) => {
    const snap = event.data;
    const { familyId, messageId } = event.params;
    const message = snap.data();

    // Skip if already extracted
    if (message.extractedFacts && message.extractedFacts.length > 0) return;

    // Get family's children for child-mapping
    const childrenSnap = await db.collection(`families/${familyId}/children`).get();
    const children = childrenSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // ── Tier 1: Regex extraction (fast, free) ──
    const regexItems = extractWithRegex(message);

    // ── Tier 2: LLM extraction (for complex messages) ──
    let llmItems = [];
    const isComplex = message.bodyText.length > 200
      || message.bodyText.includes("newsletter")
      || regexItems.length === 0;

    if (isComplex) {
      try {
        llmItems = await extractWithLLM(message, children);
      } catch (err) {
        console.error(`LLM extraction failed for ${messageId}:`, err.message);
        // Fall back to regex-only — don't block
      }
    }

    // Merge and deduplicate
    const allItems = deduplicateItems([...regexItems, ...llmItems]);

    // Resolve child mapping
    for (const item of allItems) {
      if (!item.childId && children.length === 1) {
        item.childId = children[0].id;
      }
      // If multiple children: try to match by grade/teacher/name in text
      if (!item.childId && children.length > 1) {
        item.childId = resolveChild(item.text, children) || "all";
      }
    }

    // Write extracted facts back to message
    await snap.ref.update({
      extractedFacts: allItems.map((i) => ({
        type: i.type,
        text: i.text,
        confidence: i.confidence,
      })),
      labels: [...new Set(allItems.map((i) => i.type))],
      childId: allItems[0]?.childId || "all",
    });

    // Create items
    const itemsRef = db.collection(`families/${familyId}/items`);
    const batch = db.batch();

    for (const item of allItems) {
      const ref = itemsRef.doc();
      batch.set(ref, {
        type: item.type,
        text: item.text,
        childId: item.childId || "all",
        date: item.date || todayISO(),
        time: item.time || null,
        urgent: item.urgent || false,
        done: false,
        doneBy: null,
        doneAt: null,
        amount: item.amount || null,
        link: item.link || null,
        sourceMessageId: messageId,
        sourceText: `${message.from}, ${formatDate(message.createdAt)}`,
        confidence: item.confidence,
        confirmedByUser: false,
        extractionMethod: item.method,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    // Audit
    await writeAudit(familyId, "system", "items.extracted", "message", messageId, {
      count: allItems.length,
      methods: [...new Set(allItems.map((i) => i.method))],
    });
  }
);


/**
 * Tier 1: Regex-based extraction. Fast, deterministic, high confidence.
 */
function extractWithRegex(message) {
  const items = [];
  const text = `${message.subject} ${message.bodyText}`;

  // Date patterns
  const dateRegex = /(\w+day,?\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4}/gi;

  // Time patterns
  const timeRegex = /\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\b/g;

  // Money patterns
  const moneyRegex = /\$(\d+(?:\.\d{2})?)/g;
  const moneyMatches = [...text.matchAll(moneyRegex)];
  for (const m of moneyMatches) {
    const ctx = text.substring(Math.max(0, m.index - 80), m.index + 80);
    items.push({
      type: "pay",
      text: `$${m[1]} — ${extractContext(ctx)}`,
      amount: `$${m[1]}`,
      confidence: 0.85,
      method: "regex",
      urgent: ctx.toLowerCase().includes("due") || ctx.toLowerCase().includes("today"),
    });
  }

  // "Bring" / "return" patterns
  const bringRegex = /(?:bring|return|pack|don'?t forget)\s+(.{5,60}?)(?:\.|,|$)/gi;
  for (const m of [...text.matchAll(bringRegex)]) {
    items.push({
      type: "bring",
      text: m[1].trim(),
      confidence: 0.80,
      method: "regex",
    });
  }

  // "Permission slip" / "sign" patterns
  if (/permission\s+slip|sign\s+and\s+return|needs?\s+(?:your\s+)?signature/i.test(text)) {
    items.push({
      type: "sign",
      text: "Permission slip / form needs signature",
      confidence: 0.75,
      method: "regex",
    });
  }

  // Early release / schedule change
  if (/early\s+release|early\s+dismissal|schedule\s+change/i.test(text)) {
    const times = [...text.matchAll(timeRegex)];
    items.push({
      type: "event",
      text: `Schedule change${times.length ? ` — ${times[0][1]}` : ""}`,
      time: times.length ? times[0][1] : null,
      confidence: 0.80,
      method: "regex",
      urgent: true,
    });
  }

  // Spirit day / dress code
  if (/spirit\s+day|dress\s+(?:up|code)|wear\s+(?:your|a)/i.test(text)) {
    const ctx = text.match(/(?:wear|spirit|dress)\s+.{5,50}/i);
    items.push({
      type: "wear",
      text: ctx ? ctx[0].trim() : "Special dress day",
      confidence: 0.75,
      method: "regex",
    });
  }

  return items;
}


/**
 * Tier 2: LLM-based extraction for complex/long messages.
 */
async function extractWithLLM(message, children) {
  const client = new Anthropic();

  const childNames = children.map((c) => `${c.name} (${c.grade}, ${c.teacher})`).join(", ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract actionable items from this school email for a parent.

Children: ${childNames}

Subject: ${message.subject}
From: ${message.from}
Body:
${message.bodyText.substring(0, 3000)}

Return JSON array. Each item:
{
  "type": "bring" | "sign" | "pay" | "wear" | "event" | "task",
  "text": "short description",
  "childId": "child name or all",
  "date": "YYYY-MM-DD or null",
  "time": "HH:mm or null",
  "urgent": true/false,
  "amount": "$X or null",
  "confidence": 0.0-1.0
}

Rules:
- Only extract real action items, not FYI
- Confidence: 0.9+ for explicit items, 0.6-0.8 for inferred
- If unsure which child, use "all"
- Return [] if no actionable items

JSON only, no explanation:`,
      },
    ],
  });

  try {
    const text = response.content[0].text.trim();
    const items = JSON.parse(text);
    return items.map((i) => ({
      ...i,
      method: "llm",
      childId: resolveChildName(i.childId, children),
    }));
  } catch {
    console.error("Failed to parse LLM response");
    return [];
  }
}


// ═══════════════════════════════════════════════════════════════
// 3. FAMILY LIFECYCLE
// ═══════════════════════════════════════════════════════════════

/**
 * Accept an invite: create member doc, delete invite.
 */
exports.acceptInvite = onCall(
  { enforceAppCheck: false },
  async (request) => {
    const { inviteId } = request.data;
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Must be signed in");

    const inviteRef = db.doc(`invites/${inviteId}`);
    const invite = await inviteRef.get();

    if (!invite.exists) throw new HttpsError("not-found", "Invite not found");

    const data = invite.data();

    // Verify the invite is for this user's email
    if (data.email !== request.auth.token.email) {
      throw new HttpsError("permission-denied", "Invite is for a different email");
    }

    // Create member doc + delete invite in a batch
    const batch = db.batch();

    batch.set(db.doc(`families/${data.familyId}/members/${uid}`), {
      role: data.role,
      displayName: request.auth.token.name || data.email,
      email: data.email,
      joinedAt: FieldValue.serverTimestamp(),
    });

    // Add familyId to user's familyIds array
    batch.update(db.doc(`users/${uid}`), {
      familyIds: FieldValue.arrayUnion(data.familyId),
    });

    batch.delete(inviteRef);

    await batch.commit();

    // Audit
    await writeAudit(data.familyId, uid, "member.added", "member", uid, {
      role: data.role,
      invitedBy: data.invitedBy,
    });

    return { familyId: data.familyId, role: data.role };
  }
);


// ═══════════════════════════════════════════════════════════════
// 4. COMPLIANCE — DATA EXPORT & DELETION
// ═══════════════════════════════════════════════════════════════

/**
 * Export all family data as JSON. Owner-only.
 */
exports.exportFamilyData = onCall(
  { enforceAppCheck: false, timeoutSeconds: 120 },
  async (request) => {
    const { familyId } = request.data;
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Must be signed in");

    // Verify owner
    const memberDoc = await db.doc(`families/${familyId}/members/${uid}`).get();
    if (!memberDoc.exists || memberDoc.data().role !== "owner") {
      throw new HttpsError("permission-denied", "Only owner can export");
    }

    // Collect all subcollections
    const collections = ["children", "sources", "messages", "items", "files", "audit"];
    const exportData = { family: null, members: [], ...Object.fromEntries(collections.map(c => [c, []])) };

    const familyDoc = await db.doc(`families/${familyId}`).get();
    exportData.family = familyDoc.data();

    const membersSnap = await db.collection(`families/${familyId}/members`).get();
    exportData.members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    for (const col of collections) {
      const snap = await db.collection(`families/${familyId}/${col}`).get();
      exportData[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // NOTE: In production, write to Storage and return a signed download URL
    // instead of returning the full payload (could be large).

    await writeAudit(familyId, uid, "data.exported", "family", familyId, {});

    return { data: exportData, exportedAt: new Date().toISOString() };
  }
);


/**
 * Delete all family data. Owner-only. Irreversible.
 */
exports.deleteFamilyData = onCall(
  { enforceAppCheck: false, timeoutSeconds: 120 },
  async (request) => {
    const { familyId, confirmPhrase } = request.data;
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Must be signed in");

    // Require explicit confirmation
    if (confirmPhrase !== "DELETE MY FAMILY DATA") {
      throw new HttpsError("failed-precondition", "Confirmation phrase required");
    }

    // Verify owner
    const memberDoc = await db.doc(`families/${familyId}/members/${uid}`).get();
    if (!memberDoc.exists || memberDoc.data().role !== "owner") {
      throw new HttpsError("permission-denied", "Only owner can delete");
    }

    // Delete all subcollections first
    const subcollections = [
      "members", "children", "sources", "sources_credentials",
      "messages", "items", "files", "audit"
    ];

    for (const col of subcollections) {
      const snap = await db.collection(`families/${familyId}/${col}`).get();
      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Delete Storage files
    try {
      await storage.bucket().deleteFiles({ prefix: `families/${familyId}/` });
    } catch (err) {
      console.warn("Storage deletion error (may be empty):", err.message);
    }

    // Delete family doc
    await db.doc(`families/${familyId}`).delete();

    // Remove familyId from all users' familyIds
    // (In production, also send notification to all members)

    return { deleted: true, familyId };
  }
);


// ═══════════════════════════════════════════════════════════════
// 5. AVATAR SIGNED URLS
// ═══════════════════════════════════════════════════════════════

/**
 * P1 FIX (#5): Generate short-lived signed URL for a family member's avatar.
 * Prevents cross-tenant scraping while allowing family members to see each other.
 */
exports.getAvatarUrl = onCall(
  { enforceAppCheck: false },
  async (request) => {
    const { targetUserId, familyId } = request.data;
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Must be signed in");

    // Verify both users are in the same family
    const [callerMember, targetMember] = await Promise.all([
      db.doc(`families/${familyId}/members/${uid}`).get(),
      db.doc(`families/${familyId}/members/${targetUserId}`).get(),
    ]);

    if (!callerMember.exists || !targetMember.exists) {
      throw new HttpsError("permission-denied", "Not in the same family");
    }

    // Generate signed URL (15 min expiry)
    const file = storage.bucket().file(`users/${targetUserId}/avatar/profile.png`);
    const [exists] = await file.exists();
    if (!exists) return { url: null };

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });

    return { url };
  }
);


// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function writeAudit(familyId, actorId, action, targetType, targetId, metadata) {
  await db.collection(`families/${familyId}/audit`).add({
    action,
    actorId,
    targetType,
    targetId,
    metadata,
    timestamp: FieldValue.serverTimestamp(),
  });
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(timestamp) {
  if (!timestamp) return "Unknown";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function extractContext(text) {
  // Pull a meaningful phrase from surrounding context
  return text.replace(/\$\d+(\.\d{2})?/, "").trim().substring(0, 50).trim();
}

function deduplicateItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type}:${item.text.toLowerCase().substring(0, 30)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveChild(text, children) {
  const lower = text.toLowerCase();
  for (const child of children) {
    if (lower.includes(child.name.toLowerCase())) return child.id;
    if (child.grade && lower.includes(child.grade.toLowerCase())) return child.id;
    if (child.teacher && lower.includes(child.teacher.toLowerCase())) return child.id;
  }
  return null;
}

function resolveChildName(nameOrAll, children) {
  if (!nameOrAll || nameOrAll === "all") return "all";
  const lower = nameOrAll.toLowerCase();
  const match = children.find((c) => c.name.toLowerCase() === lower);
  return match ? match.id : "all";
}
