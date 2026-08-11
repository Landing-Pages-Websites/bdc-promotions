# Managed-site contract

Private runtime, schemas, framework adapters, annotations, and conformance CLI
for Gomega-managed websites. This package is the shared executable contract
used by site repositories and Site Guard; it is not the CMS UI and it does not
publish customer changes.

## Distribution

The package is published manually from `main` to GitHub Packages as
`@landing-pages-websites/managed-site-contract`. Releases are immutable: bump
the exact version in the workspace and lockfile in a reviewed PR before running
the `Publish managed-site contract` workflow.

Before the first release, protect the `managed-site-contract-release` GitHub
Environment with required reviewers and allow deployments from `main` only.

Same-organization repository workflows should:

1. receive explicit Actions access to the package in GitHub's package settings;
2. grant `packages: read` and `contents: read` to their workflow token;
3. configure `actions/setup-node` for `https://npm.pkg.github.com` and the
   `@landing-pages-websites` scope; and
4. provide `${{ github.token }}` as `NODE_AUTH_TOKEN` only to `npm ci`.

Cross-organization consumers such as `zleague/megaseo-web` must use a dedicated
read-only package credential with `read:packages`. Never place that credential
in a repository file, build artifact, browser bundle, or customer-site runtime.

## Local workspace

The starter and reference fixtures resolve this package through npm workspaces,
so local development does not require a GitHub Packages credential.
