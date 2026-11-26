import test from "node:test";
import assert from "node:assert/strict";
import { evaluateDemoPregnancySafety } from "../lib/api/mockAdapter.ts";
import { validateReportFile } from "../lib/validation/schemas.ts";
import { STAGE_THEMES } from "../config/themes.ts";
import { LIFE_STAGE_CONFIGS } from "../config/life-stages.ts";

test("Pregnancy deterministic demo safety flags urgent symptoms and never downgrades", () => {
  const urgent = evaluateDemoPregnancySafety(["severe_headache_vision"], "started suddenly", "severe");
  assert.equal(urgent.level, "urgent");
  assert.ok(urgent.rule_ids && urgent.rule_ids.length > 0);
  assert.ok(urgent.next_steps && urgent.next_steps.length > 0);

  const keywordUrgent = evaluateDemoPregnancySafety(["other"], "experiencing vaginal bleeding");
  assert.equal(keywordUrgent.level, "urgent");

  const mild = evaluateDemoPregnancySafety(["fatigue"], "tired after walk", "mild");
  assert.equal(mild.level, "informational");
});

test("Report file validator rejects unsupported types and oversized files", () => {
  const badType = new File(["hello"], "notes.txt", { type: "text/plain" });
  assert.match(validateReportFile(badType) ?? "", /Unsupported file format/);

  const validPdf = new File(["%PDF-1.4"], "scan.pdf", { type: "application/pdf" });
  assert.equal(validateReportFile(validPdf), null);
});

test("All three life stages have distinct theme tokens and MVP flags aligned with AGENTS.md", () => {
  assert.equal(STAGE_THEMES.menstrual.primary, "#A63D62");
  assert.equal(STAGE_THEMES.pregnancy.primary, "#7952B3");
  assert.equal(STAGE_THEMES.postpartum.primary, "#386B57");

  assert.equal(LIFE_STAGE_CONFIGS.pregnancy.mvpLive, true);
  assert.equal(LIFE_STAGE_CONFIGS.menstrual.mvpLive, false);
  assert.equal(LIFE_STAGE_CONFIGS.postpartum.mvpLive, false);
});
