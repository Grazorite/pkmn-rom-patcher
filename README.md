# Universal ROM Management (UROMM)

UROMM is a browser-based ROM patcher and searchable patch library. Use your own legally obtained
base ROM. ROM files stay in the browser during patching; they are not uploaded to the site.

## Use the patcher

Browse the [library](docs/library/index.html), select a patch, then choose your local ROM in the
[patcher](docs/patcher/index.html). The patcher validates the input and offers the patched file for
download. See the [patcher guide](docs/patcher/README.md) for details.

To suggest a new patch, use the site's [submission form](docs/submit/index.html). It uses a
GitHub personal access token to create a pull request. The site stores the token in the browser's
session storage. Do not include a base ROM or credentials in a submission.

## Develop locally

From the repository root with Node.js 18 or newer:

```sh
npm ci
npm run serve
```

Open `http://localhost:3000`. Both local development and GitHub Pages serve the `docs/`
directory. Keep paths consistent between environments. The RomPatcher.js source is already
included in [the patcher directory](docs/patcher/rom-patcher-js/).

```sh
npx playwright install
npm run test:smoke    # Critical paths
npm test              # Full Playwright suite
```

See the [test guide](tests/README.md) for other suites and troubleshooting.

## Maintain the catalog

- Follow the [patch naming convention](docs/NAMING_CONVENTION.md).
- Use the [community pull request template](.github/PULL_REQUEST_TEMPLATE/community_submission.md).
- Maintainers store patches under `patches/` and Markdown metadata under `metadata/`. Do not edit
  `docs/manifest.json` by hand. See the [manifest workflow](.github/workflows/update_manifest.yml)
  for the push trigger and [workflow guide](docs/WORKFLOW_OPTIMIZATION.md) for validation behavior.
- For engineering context, see the [project context](.amazonq/rules/PROJECT_CONTEXT.md),
  [configuration guide](config/README.md), and [CSS guide](docs/assets/css/README.md).

## License and credits

ISC. Uses [RomPatcher.js](https://github.com/MarcRobledo/RomPatcher.js) by Marc Robledo,
[Lucide](https://lucide.dev/), [Fuse.js](https://www.fusejs.io/), and [Marked](https://marked.js.org/).
