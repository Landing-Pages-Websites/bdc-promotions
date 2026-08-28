import {
  ManagedSiteContractError,
  parseRepositoryPath,
} from "@landing-pages-websites/managed-site-contract";

/**
 * Where a repository path is decided, once.
 *
 * The proposer builds paths in three places -- the configured roots, the content
 * files it emits, and the assets it points at -- and the standard bounds all of
 * them the same way. Asking the canonical parser rather than describing its rules
 * again is what keeps a path that loads from failing later at emission.
 */

export function isRepositoryPath(candidate: string): boolean {
  try {
    parseRepositoryPath(candidate);
    return true;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return false;
    throw error;
  }
}

/** An image reference is written as a public URL; the file lives under the root. */
function relativeAssetPath(source: string): string {
  return source.startsWith("/") ? source.slice(1) : source;
}

/**
 * The repository path an image reference resolves to, or null when the result is
 * not a path the standard can carry.
 *
 * Both the contract emitter and the content emitter need this path, so they get
 * it from here: two constructions of one path is two chances for a proposal to
 * name a file its own manifest does not.
 */
export function assetRepositoryPath(assetRoot: string, source: string): string | null {
  const candidate = `${assetRoot}/${relativeAssetPath(source)}`;
  return isRepositoryPath(candidate) ? candidate : null;
}

/**
 * Whether the configured root is what pushed an asset path past the limit, which
 * is the difference between a setting to change and a file to move.
 */
export function assetRootIsAtFault(assetRoot: string, source: string): boolean {
  const relative = relativeAssetPath(source);
  return isRepositoryPath(relative) && !isRepositoryPath(`${assetRoot}/${relative}`);
}
