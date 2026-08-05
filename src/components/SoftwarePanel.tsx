import * as React from 'react';
import { ServerConnection } from '@jupyterlab/services';

import { requestAPI } from '../request';
import { PlatformSelector } from './PlatformSelector';
import { SearchBar } from './SearchBar';
import { RepositoryCard } from './RepositoryCard';

interface Version {
  versionName: string;
  full: string;
  help: string;
  path: string;
  family?: string;
}

interface Package {
  package: string;
  versions: Version[];
  defaultVersionName: string;
  categories: string;
}

interface Repository {
  name: string;
  packages: Package[];
}

interface CatalogResponse {
  platform: string;
  repositories: Repository[];
}

interface PlatformInfo {
  architecture: string;
  os: string;
  available: string[];
  compatible: string[];
  selected: string;
}

interface Props {
  initialRepositories: Repository[];
  initialPlatform: PlatformInfo;
  serverSettings: ServerConnection.ISettings;
}

export function SoftwarePanel({
  initialRepositories,
  initialPlatform,
  serverSettings
}: Props) {

  const [repositories, setRepositories] =
    React.useState(initialRepositories);

  const [platform, setPlatform] =
    React.useState(initialPlatform);

  const [query, setQuery] =
    React.useState("");

  const [expandedRepository, setExpandedRepository] =
    React.useState<string | null>(null);

  const changePlatform = async (newPlatform: string) => {

    const response = await requestAPI<CatalogResponse>(
      `catalog?platform=${newPlatform}`,
      serverSettings
    );

    setPlatform({
      ...platform,
      selected: newPlatform
    });

    setRepositories(response.repositories);

    setExpandedRepository(null);
  };

  return (

    <div
      className="cvmfs-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "8px"
      }}
    >

      <h2>CVMFS Software Explorer</h2>

      <PlatformSelector
        platforms={platform.compatible}
        selected={platform.selected}
        onChange={changePlatform}
      />

      <SearchBar
        query={query}
        onChange={setQuery}
      />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginTop: "12px"
        }}
      >

        {repositories.map(repo => (

          <RepositoryCard
            key={repo.name}
            repository={repo}
            query={query}
            expanded={expandedRepository === repo.name}
            onToggle={() =>
              setExpandedRepository(
                expandedRepository === repo.name
                  ? null
                  : repo.name
              )
            }
          />

        ))}

      </div>

    </div>

  );
}