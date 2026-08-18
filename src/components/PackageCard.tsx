import * as React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import {
  ServerConnection,
  KernelSpec
} from '@jupyterlab/services';

import {
  VersionCard,
  Version
} from './VersionCard';

export interface Package {
  package: string;
  versions: Version[];
  defaultVersionName: string;
  categories: string;
}

interface Props {
  pkg: Package;
  expanded: boolean;
  onToggle: () => void;
  serverSettings: ServerConnection.ISettings;
  kernelSpecManager: KernelSpec.IManager;
  app: JupyterFrontEnd;
  onKernelChange: () => void;
  kernelRefresh: number;
}

export function PackageCard({
  pkg,
  expanded,
  onToggle,
  serverSettings,
  kernelSpecManager,
  app
}: Props) {
  const [
    expandedVersion,
    setExpandedVersion
  ] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!expanded) {
      setExpandedVersion(null);
    }
  }, [expanded]);

  return (
    <div className="cvmfs-package">

      <button
        type="button"
        className="cvmfs-package-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >

        <span className="cvmfs-expand-icon">
          {expanded ? '▼' : '▶'}
        </span>

        <span className="cvmfs-package-name">
          {pkg.package}
        </span>

        <span className="cvmfs-version-count">
          {pkg.versions.length}{' '}
          {pkg.versions.length === 1
            ? 'version'
            : 'versions'}
        </span>

      </button>

      {expanded && (
        <div className="cvmfs-package-content">

          {pkg.versions.map(
            version => (
              <VersionCard
                key={version.full}
                version={version}
                category={
                  pkg.categories
                }
                isDefault={
                  version.versionName ===
                  pkg.defaultVersionName
                }
                expanded={
                  expandedVersion ===
                  version.full
                }
                onToggle={() =>
                  setExpandedVersion(
                    expandedVersion ===
                      version.full
                      ? null
                      : version.full
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
            )
          )}

        </div>
      )}

    </div>
  );
}