import * as React from 'react';

export interface Version {
  versionName: string;
  full: string;
  help: string;
  path: string;
  family?: string;
}

interface Props {
  version: Version;
  category: string;
  isDefault: boolean;

  expanded: boolean;
  onToggle: () => void;
}

export function VersionCard({
  version,
  category,
  isDefault,
  expanded,
  onToggle
}: Props) {
  return (
    <div className="version-card">

      <button
        className="version-header"
        onClick={onToggle}
      >
        {expanded ? "▼" : "▶"}{" "}
        {version.versionName}
        {isDefault && " (default)"}
      </button>

      {expanded && (
        <div className="version-details">

          <p>
            <b>Category</b>
          </p>

          <p>{category}</p>

          <p>
            <b>Module</b>
          </p>

          <p>{version.full}</p>

          <p>
            <b>Help</b>
          </p>

          <pre>{version.help}</pre>

          <p>
            <b>Modulefile</b>
          </p>

          <p>{version.path}</p>

          <button
            disabled
            onClick={() => console.log("Activate", version.full)}
          >
            Activate
          </button>

        </div>
      )}

    </div>
  );
}