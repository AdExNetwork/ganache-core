# Developer Documentation

## Getting set up

 * Use node v10.7.0 (or whatever the lowest engine is in the root package.json)
 * `git clone git@github.com:trufflesuite/ganache-core.git`
 * `cd ganache-core`
 * `npm install`

## Clean install
 * `npm run clean`
 * `npm install`

 ## VSCode On Windows (10)

 * Enable "Developer Mode" by going to Settings -> Developer Settings -> Then select Developer Mode.

## To build

Builds all packages:

* `npm run tsc`

## To test

Runs all tests:

* `npm test`

## To create a new package

* `npm run create <name>`

This will create a new package with Ganache defaults at `packages/<name>`.

## To add a module to a package:

* `npx lerna add <module>[@version] -E [--dev] [--peer] --scope=<package>`

Where `<module>` is the npm-module you want to add and `<package>` is where you
want to add it. See [@lerna/add documentation](https://github.com/lerna/lerna/tree/master/commands/add) for more details.

Example:

```
npx lerna add @ganache/options --scope=@ganache/filecoin
```

will add our local `@ganache/options` package to the `@ganache/filecoin` package.

## To remove a module from another package:

`cd` to the package and then run `npm uninstall <module>`

## Code Conventions

These are guidelines, not rules. :-)

- Use Node v10.7.0 for most local development. This is the earliest version we support.
- Use `bigint` literals, e.g., `123n`; if the number is externally configurable and/or could exceed
  `Number.MAX_SAFE_INTEGER`
- Write tests.
- Do not use "Optional Chaining" (`obj?.prop`). I'd love to enable this, but TypeScript makes it hard to use bigint
  literals and optional chaining together.
- Prefer using a single loop to functional chaining.
- Prefer performant code over your own developer experience.
- Document complex code. Explain why the code does what it does.
- Feel free to be clever, just document _why_ you're being clever. If it's hard to read, comment _what_ the code does,
  too.
- Add JSDoc comments to public class members where it makes sense.
- Before adding an external dependency check its code for quality, its # of external dependencies, its node version
  support, and make sure it absolutely necessary.
- Pin all dependencies, even dev dependencies.
- Use npm; do not use yarn.
- Don't use web3, ethers, etc in ganache-core core code. (Tests are fine)
- Ensure a smooth development experience on Windows, Mac, and Linux.
- Do not use bash scripts.
- Do not use CLI commands in npm scripts or build scripts that aren't available by default on supported platforms.
- Push your code often (at least every-other day!), even broken WIP code (to your own branch, of course).
