import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the source extension.
import { resolveSort } from "./list-sort.ts";

test("resolveSort accepts allowed fields and directions", () => {
  assert.deepEqual(
    resolveSort("createTime", "asc", ["createTime"], "id"),
    { field: "createTime", direction: "asc" },
  );
  assert.deepEqual(
    resolveSort("createTime", "desc", ["createTime"], "id"),
    { field: "createTime", direction: "desc" },
  );
});

test("resolveSort falls back safely for missing or invalid input", () => {
  assert.deepEqual(resolveSort(undefined, undefined, ["createTime"], "id"), {
    field: "id",
    direction: "desc",
  });
  assert.deepEqual(resolveSort("unknown", "asc", ["createTime"], "id"), {
    field: "id",
    direction: "desc",
  });
  assert.deepEqual(resolveSort(undefined, undefined, ["loginTime"], "loginTime"), {
    field: "loginTime",
    direction: "desc",
  });
});
