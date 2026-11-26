# PR review checklist

- [ ] Target `develop` for all features, never `main`.
- [ ] Only changed owned files, or cross-owner changes agreed.
- [ ] API contracts updated in `shared/api-contracts.md` if modified.
- [ ] Tests and mobile smoke tests run; screenshots for UI.
- [ ] No exposed Gemini API key / GCP service credentials / real patient data.
- [ ] Unimplemented stages/features honestly labelled Coming Soon.
- [ ] Emergency pregnancy warning guidance not overridden by AI-generated text.
- [ ] Integration lead reviews before merge.

A separate tested release PR `develop` -> `main` is the only release path.
