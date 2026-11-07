import test from "node:test";
import assert from "node:assert/strict";
import {
  canManageDocument,
  canViewDocument,
} from "../src/services/documentAuthorization.js";

const engineer = { id: "engineer-1", role: "ENGINEER", team_id: "team-a" };
const otherTeamEngineer = {
  id: "engineer-2",
  role: "ENGINEER",
  team_id: "team-b",
};
const admin = { id: "admin-1", role: "ENGINEERING_ADMIN", team_id: null };

function document(overrides = {}) {
  return {
    status: "PUBLISHED",
    access_scope: "ALL_EMPLOYEES",
    team_id: null,
    ...overrides,
  };
}

test("engineer can access a published ALL_EMPLOYEES document", () => {
  assert.equal(canViewDocument(engineer, document()), true);
});

test("engineer can access a published TEAM_ONLY document for their team", () => {
  assert.equal(
    canViewDocument(
      engineer,
      document({ access_scope: "TEAM_ONLY", team_id: "team-a" }),
    ),
    true,
  );
});

test("engineer cannot access another team's document", () => {
  assert.equal(
    canViewDocument(
      engineer,
      document({ access_scope: "TEAM_ONLY", team_id: "team-b" }),
    ),
    false,
  );
  assert.equal(
    canViewDocument(
      otherTeamEngineer,
      document({ access_scope: "TEAM_ONLY", team_id: "team-a" }),
    ),
    false,
  );
});

test("engineer cannot access ADMIN_ONLY, draft, or archived documents", () => {
  assert.equal(
    canViewDocument(engineer, document({ access_scope: "ADMIN_ONLY" })),
    false,
  );
  assert.equal(
    canViewDocument(engineer, document({ status: "DRAFT" })),
    false,
  );
  assert.equal(
    canViewDocument(engineer, document({ status: "ARCHIVED" })),
    false,
  );
});

test("engineering admin can access every document scope and status", () => {
  assert.equal(canViewDocument(admin, document({ access_scope: "ADMIN_ONLY" })), true);
  assert.equal(canViewDocument(admin, document({ status: "DRAFT" })), true);
  assert.equal(canViewDocument(admin, document({ status: "ARCHIVED" })), true);
  assert.equal(canManageDocument(admin), true);
  assert.equal(canManageDocument(engineer), false);
});
