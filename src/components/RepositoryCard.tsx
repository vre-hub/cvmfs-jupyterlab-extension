import * as React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import {
  ServerConnection,
  KernelSpec
} from '@jupyterlab/services';

import {
  PackageCard,
  Package
} from './PackageCard';

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
  onKernelChange: () => void;
  kernelRefresh: number;
}

export function RepositoryCard({
  repository,
  query,
  expanded,
  onToggle,
  serverSettings,
  kernelSpecManager,
  app,
  onKernelChange,
  kernelRefresh
}: Props) {
  const [
    expandedPackage,
    setExpandedPackage
  ] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!expanded) {
      setExpandedPackage(null);
    }
  }, [expanded]);

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

  if (
    filteredPackages.length === 0
  ) {
    return null;
  }

  const packageCount =
    filteredPackages.length;

  return (
    <div className="cvmfs-repository">

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

      {expanded && (
        <div className="cvmfs-repository-content">

          <div className="cvmfs-repository-summary">
            {packageCount}{' '}
            {packageCount === 1
              ? 'package'
              : 'packages'}
          </div>

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
                onKernelChange={
                  onKernelChange
                }
                kernelRefresh={
                  kernelRefresh
                }
              />
            ))}

          </div>

        </div>
      )}

    </div>
  );
}