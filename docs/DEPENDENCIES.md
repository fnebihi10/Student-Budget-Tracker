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

## Current-checkout recheck and owner decision

The continuation against `aff1b7fbab73253142285aeadc3d0b6311521d80` repeated
online npm audit and both registry queries on 2026-10-04. Audit exits 1 with 46
high entries; [fresh raw evidence](dependency-audit-followup.json) is separate
from the earlier report. Latest published versions remain braces 3.0.3 and
node-forge 1.4.0. Both linked primary advisory pages still list no patched version.
No dependency/lockfile changes or incompatible downgrades were made.

`npm ls braces node-forge` confirms Expo CLI -> Metro file-map -> micromatch ->
braces, and Expo CLI -> code-signing-certificates -> forge (plus a direct CLI forge
dependency). Installed code-signing tooling uses certificate and CSR verification
and public-key signature verification. These are concrete affected build/signing
workflows; no matching imports were found in application source. This limited
inspection does not prove absence from every bundle or every execution path.

Pending owner decision (not approved by the agent): retain release hold, or record
a dated, scoped risk acceptance for **both** GHSA-vfj7-8cjw-p6xm and
GHSA-86w9-cpqp-85rv. Specify release/build pipelines in scope, accountable owner,
review date and remediation deadline. Document controls over glob patterns and
certificate/CSR inputs, restrict tooling execution to trusted project inputs,
and isolate build workers. Do not process external cryptographic inputs using
this tooling without reassessment. Residual uncertainty includes dependency paths
outside the inspected code, actual exploitability of each signing workflow and
whether upstream fixes will land within the release window. Passing tests and
exports do not waive that uncertainty. Monitor upstream, then verify any published
compatible fixes with the checks listed above before changing the decision.
