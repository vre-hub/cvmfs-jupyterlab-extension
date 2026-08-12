import * as React from 'react';
import { VersionCard, Version } from './VersionCard';
import { ServerConnection } from '@jupyterlab/services';
import { KernelSpec } from '@jupyterlab/services';

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
}

export function PackageCard({
  pkg,
  expanded,
  onToggle,
  serverSettings,
  kernelSpecManager
}: Props) {
  const [expandedVersion, setExpandedVersion] =
    React.useState<string | null>(null);

  React.useEffect(() => {
    if (!expanded) {
      setExpandedVersion(null);
    }
  }, [expanded]);

  return (
    <div className="package-card">
      <button
        className="package-header"
        onClick={onToggle}
      >
        {expanded ? '▼' : '▶'} {pkg.package}
      </button>

      {expanded && (
        <div className="package-versions">
          {pkg.versions.map(version => (
            <VersionCard
              key={version.full}
              version={version}
              category={pkg.categories}
              isDefault={
                version.versionName ===
                pkg.defaultVersionName
              }
              expanded={
                expandedVersion === version.full
              }
              onToggle={() =>
                setExpandedVersion(
                  expandedVersion === version.full
                    ? null
                    : version.full
                )
              }
              serverSettings={serverSettings}
              kernelSpecManager={kernelSpecManager}
            />
          ))}
        </div>
      )}
    </div>
  );
}