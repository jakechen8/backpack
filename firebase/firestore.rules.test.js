/**
 * Firestore Security Rules Tests
 *
 * Run with: firebase emulators:exec --only firestore "npx jest firestore.rules.test.js"
 * Requires: @firebase/rules-unit-testing
 *
 * These tests validate every finding from the security audit.
 */

const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { readFileSync } = require("fs");

const PROJECT_ID = "backpack-test";
let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ── Helpers ──────────────────────────────────────────────────

async function setupFamily(familyId = "family1") {
  const admin = testEnv.authenticatedContext("admin-uid").firestore();

  // Use admin SDK context to set up data
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(`families/${familyId}`).set({
      name: "Test Family",
      createdBy: "owner-uid",
      createdAt: new Date(),
    });
    await db.doc(`families/${familyId}/members/owner-uid`).set({
      role: "owner",
      displayName: "Owner",
      joinedAt: new Date(),
    });
    await db.doc(`families/${familyId}/members/parent-uid`).set({
      role: "parent",
      displayName: "Parent",
      joinedAt: new Date(),
    });
    await db.doc(`families/${familyId}/members/viewer-uid`).set({
      role: "viewer",
      displayName: "Grandma",
      joinedAt: new Date(),
    });
    // Add a test item
    await db.doc(`families/${familyId}/items/item1`).set({
      type: "bring",
      text: "Library book",
      done: false,
      doneBy: null,
      doneAt: null,
      date: "2026-03-05",
      urgent: false,
      childId: "child1",
    });
  });
}

function getDb(uid, email) {
  return testEnv.authenticatedContext(uid, { email }).firestore();
}

function getUnauthedDb() {
  return testEnv.unauthenticatedContext().firestore();
}


// ═══════════════════════════════════════════════════════════════
// P0 #1: INVITE ESCALATION
// ═══════════════════════════════════════════════════════════════

describe("P0: Invite security", () => {
  beforeEach(() => setupFamily());

  test("owner can create invite with valid role", async () => {
    const db = getDb("owner-uid", "owner@test.com");
    await assertSucceeds(
      db.collection("invites").add({
        familyId: "family1",
        email: "grandpa@test.com",
        role: "viewer",
        invitedBy: "owner-uid",
        createdAt: new Date(),
      })
    );
  });

  test("BLOCKED: random user cannot create invite", async () => {
    const db = getDb("random-uid", "random@test.com");
    await assertFails(
      db.collection("invites").add({
        familyId: "family1",
        email: "victim@test.com",
        role: "parent",
        invitedBy: "random-uid",
        createdAt: new Date(),
      })
    );
  });

  test("BLOCKED: cannot invite as owner (privilege escalation)", async () => {
    const db = getDb("owner-uid", "owner@test.com");
    await assertFails(
      db.collection("invites").add({
        familyId: "family1",
        email: "attacker@test.com",
        role: "owner",
        invitedBy: "owner-uid",
        createdAt: new Date(),
      })
    );
  });

  test("BLOCKED: cannot spoof invitedBy field", async () => {
    const db = getDb("owner-uid", "owner@test.com");
    await assertFails(
      db.collection("invites").add({
        familyId: "family1",
        email: "someone@test.com",
        role: "viewer",
        invitedBy: "someone-else-uid",
        createdAt: new Date(),
      })
    );
  });

  test("BLOCKED: viewer cannot create invites", async () => {
    const db = getDb("viewer-uid", "viewer@test.com");
    await assertFails(
      db.collection("invites").add({
        familyId: "family1",
        email: "friend@test.com",
        role: "viewer",
        invitedBy: "viewer-uid",
        createdAt: new Date(),
      })
    );
  });
});


// ═══════════════════════════════════════════════════════════════
// P0 #2: VIEWER ITEM MUTATION
// ═══════════════════════════════════════════════════════════════

describe("P0: Viewer item updates", () => {
  beforeEach(() => setupFamily());

  test("viewer CAN toggle done status", async () => {
    const db = getDb("viewer-uid");
    await assertSucceeds(
      db.doc("families/family1/items/item1").update({
        done: true,
        doneBy: "viewer-uid",
        doneAt: new Date(),
      })
    );
  });

  test("BLOCKED: viewer cannot change item text", async () => {
    const db = getDb("viewer-uid");
    await assertFails(
      db.doc("families/family1/items/item1").update({
        text: "Modified by viewer",
      })
    );
  });

  test("BLOCKED: viewer cannot change deadline/date", async () => {
    const db = getDb("viewer-uid");
    await assertFails(
      db.doc("families/family1/items/item1").update({
        date: "2026-12-31",
      })
    );
  });

  test("BLOCKED: viewer cannot change urgency", async () => {
    const db = getDb("viewer-uid");
    await assertFails(
      db.doc("families/family1/items/item1").update({
        urgent: true,
      })
    );
  });

  test("parent CAN change any item field", async () => {
    const db = getDb("parent-uid");
    await assertSucceeds(
      db.doc("families/family1/items/item1").update({
        text: "Updated by parent",
        date: "2026-03-10",
        urgent: true,
      })
    );
  });
});


// ═══════════════════════════════════════════════════════════════
// P1 #3: TOKEN ISOLATION
// ═══════════════════════════════════════════════════════════════

describe("P1: Token isolation", () => {
  beforeEach(async () => {
    await setupFamily();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc("families/family1/sources_credentials/src1").set({
        accessToken: "secret-token",
        refreshToken: "secret-refresh",
      });
    });
  });

  test("BLOCKED: owner cannot read credentials", async () => {
    const db = getDb("owner-uid");
    await assertFails(
      db.doc("families/family1/sources_credentials/src1").get()
    );
  });

  test("BLOCKED: parent cannot read credentials", async () => {
    const db = getDb("parent-uid");
    await assertFails(
      db.doc("families/family1/sources_credentials/src1").get()
    );
  });

  test("BLOCKED: anyone cannot write credentials", async () => {
    const db = getDb("owner-uid");
    await assertFails(
      db.doc("families/family1/sources_credentials/src1").set({
        accessToken: "evil",
      })
    );
  });
});


// ═══════════════════════════════════════════════════════════════
// P1 #4: FAMILY BOOTSTRAP
// ═══════════════════════════════════════════════════════════════

describe("P1: Family creation invariants", () => {
  test("can create family with required fields", async () => {
    const db = getDb("new-user");
    await assertSucceeds(
      db.doc("families/newFamily").set({
        name: "New Family",
        createdBy: "new-user",
        createdAt: new Date(),
      })
    );
  });

  test("BLOCKED: cannot spoof createdBy", async () => {
    const db = getDb("new-user");
    await assertFails(
      db.doc("families/newFamily").set({
        name: "Evil Family",
        createdBy: "someone-else",
        createdAt: new Date(),
      })
    );
  });

  test("BLOCKED: cannot create family without required fields", async () => {
    const db = getDb("new-user");
    await assertFails(
      db.doc("families/newFamily").set({
        name: "Incomplete",
      })
    );
  });

  test("creator can bootstrap their own owner member doc", async () => {
    // First create family with rules disabled (simulating a batch)
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc("families/fam2").set({
        name: "Fam2", createdBy: "creator-uid", createdAt: new Date(),
      });
    });
    const db = getDb("creator-uid");
    await assertSucceeds(
      db.doc("families/fam2/members/creator-uid").set({
        role: "owner",
        displayName: "Creator",
        joinedAt: new Date(),
      })
    );
  });

  test("BLOCKED: creator cannot bootstrap as non-owner", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc("families/fam3").set({
        name: "Fam3", createdBy: "creator-uid", createdAt: new Date(),
      });
    });
    const db = getDb("creator-uid");
    await assertFails(
      db.doc("families/fam3/members/creator-uid").set({
        role: "parent",
        displayName: "Trying to be parent",
      })
    );
  });
});


// ═══════════════════════════════════════════════════════════════
// GENERAL ACCESS CONTROLS
// ═══════════════════════════════════════════════════════════════

describe("General access", () => {
  beforeEach(() => setupFamily());

  test("BLOCKED: unauthenticated user cannot read family", async () => {
    const db = getUnauthedDb();
    await assertFails(db.doc("families/family1").get());
  });

  test("BLOCKED: non-member cannot read family items", async () => {
    const db = getDb("outsider-uid");
    await assertFails(db.doc("families/family1/items/item1").get());
  });

  test("BLOCKED: no one can write messages from client", async () => {
    const db = getDb("owner-uid");
    await assertFails(
      db.collection("families/family1/messages").add({
        from: "fake@school.com",
        subject: "Injected message",
      })
    );
  });

  test("BLOCKED: audit log is immutable from client", async () => {
    const db = getDb("owner-uid");
    await assertFails(
      db.collection("families/family1/audit").add({
        action: "fake.action",
      })
    );
  });
});
