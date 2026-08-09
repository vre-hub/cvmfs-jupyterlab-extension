import * as React from 'react';
import { PackageCard, Package } from './PackageCard';
import { ServerConnection } from '@jupyterlab/services';

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
}

export function RepositoryCard({
  repository,
  query,
  expanded,
  onToggle,
  serverSettings
}: Props) {

  const [expandedPackage, setExpandedPackage] =
    React.useState<string | null>(null);

  React.useEffect(() => {
    if (!expanded) {
      setExpandedPackage(null);
    }
  }, [expanded]);

  const filteredPackages = repository.packages.filter(pkg => {

    const q = query.toLowerCase();

    if (q === "") {
      return true;
    }

    if (pkg.package.toLowerCase().includes(q)) {
      return true;
    }

    return pkg.versions.some(version =>
      version.versionName.toLowerCase().includes(q) ||
      version.full.toLowerCase().includes(q) ||
      version.help.toLowerCase().includes(q)
    );

  });

  if (filteredPackages.length === 0) {
    return null;
  }

  return (

    <div className="repository-card">

      <button
        className="repository-header"
        onClick={onToggle}
      >
        {expanded ? "▼" : "▶"} {repository.name}
      </button>

      {expanded && (

        <div className="repository-packages">

          {filteredPackages.map(pkg => (

            <PackageCard
              key={pkg.package}
              pkg={pkg}
              expanded={expandedPackage === pkg.package}
              onToggle={() =>
                setExpandedPackage(
                  expandedPackage === pkg.package
                    ? null
                    : pkg.package
                )
              }
               serverSettings={serverSettings}
            />

          ))}

        </div>

      )}

    </div>

  );
}