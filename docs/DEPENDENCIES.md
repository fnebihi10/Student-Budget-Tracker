# Tooling dependency findings — 2026-10-04

The previous report's four high-severity entries are not a current count.
A live online `npm audit --offline=false --prefer-online --json` reports high
entries (46) propagated through the Expo/Metro/React Native/Jest toolchain. See the
raw [audit evidence](dependency-audit.json). An earlier offline/cache audit
returned zero and was discarded as invalid evidence for current advisories.

| Package installed | Underlying advisory | Affected range / patch | Exposure and decision |
| --- | --- | --- | --- |
| node-forge 1.4.0 | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | <=1.4.0; no published patch at verification | RSA ASN.1 signature verification accepts a malformed nested DigestAlgorithm sequence. Expo code-signing certificate tooling imports forge for PEM/certificate/CSR handling and verification. Risk concerns verification of untrusted cryptographic inputs in tooling. No financial-input path to forge was found in app source; this is a source inspection inference, not a runtime exploit assessment. |
| braces 3.0.3 | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | <=3.0.3; no published patch at verification | Crafted deeply nested brace patterns can exhaust the stack. Transitive glob/tooling consumers process patterns during development/build/test. Do not feed externally supplied patterns into this chain. Ordinary financial text is not supplied to these glob APIs in the application. |

Registry checks with online mode returned node-forge 1.4.0 and braces 3.0.3 as
the latest published versions. The existing supported Expo SDK 57 patches are
retained. The audit's suggested Expo 44 downgrade and incompatible React Native/
Jest changes were not applied. There is no supported fixed package version to
install for these two findings at this check; invented overrides would not fix
their implementation. Existing URI decoder and UUID overrides remain covered
by regression tests. The only new dependency is axe's Playwright integration for
browser accessibility verification, recorded in the lockfile.

Remediation: monitor the linked advisories and upstream Expo code-signing and
Metro/glob releases; install published fixed versions within Expo's supported
dependency set, regenerate the lockfile normally, run `npm ci`, Expo Doctor,
strict types, Jest, migration checks, three-platform exports, and browser suites.
Reassess any native signing pipeline before handling untrusted certificates/CSRs.
Do not interpret a successful export as resolution of the advisories. Both
findings remain unresolved release dependencies.
The follow-up online audit again reported 46 high entries, and registry queries
again returned braces 3.0.3 and node-forge 1.4.0. The explicit decision is
[hold release](RELEASE_DECISION.md); no advisory waiver has been granted.

The older forge advisories fixed in 1.4.0 do not establish that this later RSA
finding is fixed: see the upstream [incomplete-fix report](https://github.com/digitalbazaar/forge/issues/1149).
