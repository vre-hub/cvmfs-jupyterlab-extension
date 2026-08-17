import * as React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import {
  KernelSpec,
  ServerConnection
} from '@jupyterlab/services';

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
  kernelSpecManager: KernelSpec.IManager;
  app: JupyterFrontEnd;
}

export function SoftwarePanel({
  initialRepositories,
  initialPlatform,
  serverSettings,
  kernelSpecManager,
  app
}: Props) {
  const [repositories, setRepositories] =
    React.useState(initialRepositories);

  const [platform, setPlatform] =
    React.useState(initialPlatform);

  const [query, setQuery] =
    React.useState('');

  const [
    expandedRepository,
    setExpandedRepository
  ] = React.useState<string | null>(null);

  const changePlatform = async (
    newPlatform: string
  ) => {
    const response =
      await requestAPI<CatalogResponse>(
        `catalog?platform=${encodeURIComponent(
          newPlatform
        )}`,
        serverSettings
      );

    setPlatform({
      ...platform,
      selected: newPlatform
    });

    setRepositories(
      response.repositories
    );

    setExpandedRepository(null);
  };

  return (
    <div className="cvmfs-container">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="cvmfs-header">

        <h2>
          CVMFS Software Explorer
        </h2>

        <p>
          Browse and activate software
          available through CVMFS.
        </p>

      </div>


      {/* =================================================
          PLATFORM INFORMATION
          ================================================= */}

      <div className="cvmfs-platform-card">

        <div className="cvmfs-platform-selector-area">

          <PlatformSelector
            platforms={
              platform.compatible
            }
            selected={
              platform.selected
            }
            onChange={
              changePlatform
            }
          />

        </div>


        <div className="cvmfs-platform-details">

          <div className="cvmfs-platform-detail">

            <strong>
              Architecture
            </strong>

            <span>
              {platform.architecture}
            </span>

          </div>


          <div className="cvmfs-platform-detail">

            <strong>
              Operating system
            </strong>

            <span>
              {platform.os}
            </span>

          </div>


          <div className="cvmfs-platform-detail">

            <strong>
              Selected stack
            </strong>

            <code>
              {platform.selected}
            </code>

          </div>

        </div>


        <div className="cvmfs-platform-explanation">

          <strong>
            About this platform
          </strong>

          <span>
            This software stack is selected
            based on the detected system
            architecture and operating system.
            It provides software built for
            the compatible environment shown
            above.
          </span>

        </div>

      </div>


      {/* =================================================
          SEARCH
          ================================================= */}

      <SearchBar
        query={query}
        onChange={setQuery}
      />


      {/* =================================================
          SOFTWARE HIERARCHY
          ================================================= */}

      <div className="cvmfs-repository-list">

        {repositories.map(
          repository => (
            <RepositoryCard
              key={repository.name}
              repository={repository}
              query={query}
              expanded={
                expandedRepository ===
                repository.name
              }
              onToggle={() =>
                setExpandedRepository(
                  expandedRepository ===
                    repository.name
                    ? null
                    : repository.name
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

    </div>
  );
}