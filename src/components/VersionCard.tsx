import * as React from 'react';

import { ServerConnection } from '@jupyterlab/services';

import { requestAPI } from '../request';

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
  serverSettings: ServerConnection.ISettings;
}

export function VersionCard({
  version,
  category,
  isDefault,
  expanded,
  onToggle,
  serverSettings
}: Props) {
  const [activating, setActivating] = React.useState(false);

  const handleActivate = async () => {
    setActivating(true);

    try {
      const data = await requestAPI('activate', serverSettings, {
        method: 'POST',
        body: JSON.stringify({
          modules: [version.full],
          display_name: `Python (${version.full})`
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Kernel created:', data);

    } catch (error) {
      console.error('Failed to activate module:', error);
    } finally {
      setActivating(false);
    }
  };

  return (
    <>
      <button
        className="version-header"
        onClick={onToggle}
      >
        {expanded ? '▼' : '▶'} {version.versionName}
        {isDefault && ' (default)'}
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
            disabled={activating}
            onClick={handleActivate}
          >
            {activating ? 'Activating...' : 'Activate'}
          </button>

        </div>
      )}
    </>
  );
}