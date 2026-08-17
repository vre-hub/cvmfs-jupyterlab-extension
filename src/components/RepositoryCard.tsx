import * as React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import {
  PackageCard,
  Package
} from './PackageCard';

import {
  ServerConnection,
  KernelSpec
} from '@jupyterlab/services';

interface Repository {
  name: string;
  packages: Package[];
}

interface Props {
  repository: Repository;
  query: string;
  expanded: boolean;
  onToggle: () => void;
  serverSettings: ServerConnection.ISettings;
  kernelSpecManager: KernelSpec.IManager;
  app: JupyterFrontEnd;
}

export function RepositoryCard({
  repository,
  query,
  expanded,
  onToggle,
  serverSettings,
  kernelSpecManager,
  app
}: Props) {
  const [
    expandedPackage,
    setExpandedPackage
  ] = React.useState<string | null>(null);

  /*
   * Collapse any open package when
   * the repository itself is collapsed.
   */
  React.useEffect(() => {
    if (!expanded) {
      setExpandedPackage(null);
    }
  }, [expanded]);

  /*
   * Filter packages using the search query.
   */
  const filteredPackages =
    repository.packages.filter(pkg => {
      const q =
        query.trim().toLowerCase();

      if (!q) {
        return true;
      }

      if (
        pkg.package
          .toLowerCase()
          .includes(q)
      ) {
        return true;
      }

      if (
        pkg.categories
          .toLowerCase()
          .includes(q)
      ) {
        return true;
      }

      return pkg.versions.some(
        version =>
          version.versionName
            .toLowerCase()
            .includes(q) ||
          version.full
            .toLowerCase()
            .includes(q) ||
          version.help
            .toLowerCase()
            .includes(q)
      );
    });

  /*
   * Hide repositories with no matching
   * packages.
   */
  if (
    filteredPackages.length === 0
  ) {
    return null;
  }

  const packageCount =
    filteredPackages.length;

  return (
    <div className="cvmfs-repository">

      {/* =================================================
          STICKY REPOSITORY HEADER
          ================================================= */}

      <div className="cvmfs-repository-sticky">

        <button
          type="button"
          className="cvmfs-repository-header"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <span className="cvmfs-expand-icon">
            {expanded ? '▼' : '▶'}
          </span>

          <span className="cvmfs-repository-name">
            {repository.name}
          </span>
        </button>

      </div>


      {/* =================================================
          EXPANDED REPOSITORY
          ================================================= */}

      {expanded && (
        <div className="cvmfs-repository-content">

          {/* ---------------------------------------------
              Package count
              --------------------------------------------- */}

          <div className="cvmfs-repository-summary">
            {packageCount}{' '}
            {packageCount === 1
              ? 'package'
              : 'packages'}
          </div>


          {/* ---------------------------------------------
              Packages
              --------------------------------------------- */}

          <div className="cvmfs-package-list">

            {filteredPackages.map(pkg => (
              <PackageCard
                key={pkg.package}
                pkg={pkg}
                expanded={
                  expandedPackage ===
                  pkg.package
                }
                onToggle={() =>
                  setExpandedPackage(
                    expandedPackage ===
                      pkg.package
                      ? null
                      : pkg.package
                  )
                }
                serverSettings={
                  serverSettings
                }
                kernelSpecManager={
                  kernelSpecManager
                }
                app={app}
              />
            ))}

          </div>

        </div>
      )}

    </div>
  );
}