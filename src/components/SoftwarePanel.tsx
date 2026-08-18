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
import { ActiveModules } from './ActiveModules';

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

  /*
   * Increment whenever the active kernel state
   * changes. ActiveModules and VersionCards use
   * this to refresh their state immediately.
   */
  const [kernelRefresh, setKernelRefresh] =
    React.useState(0);

  const handleKernelChange = () => {
    setKernelRefresh(
      value => value + 1
    );
  };

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

  const lcgRepository =
    repositories.find(
      repository =>
        repository.name === 'LCG Releases'
    );

  return (
    <div className="cvmfs-container">

      {/* HEADER */}

      <div className="cvmfs-header">

        <h2>
          CVMFS Software Explorer
        </h2>

        <p>
          Browse and activate software
          available through CVMFS.
        </p>

      </div>


      {/* SEARCH */}

      <SearchBar
        query={query}
        onChange={setQuery}
      />


      {/* ACTIVE MODULES */}

      <ActiveModules
        serverSettings={serverSettings}
        kernelSpecManager={kernelSpecManager}
        app={app}
        refresh={kernelRefresh}
        onKernelChange={handleKernelChange}
      />


      {/* LCG SOFTWARE */}

      {lcgRepository && (
        <div className="cvmfs-lcg-section">

          <div className="cvmfs-lcg-header">
            <strong>
              LCG Software
            </strong>
          </div>


          {/* PLATFORM SELECTOR */}

          <div className="cvmfs-platform-details">

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


          {/* LCG RELEASES */}

          <RepositoryCard
            repository={lcgRepository}
            query={query}
            expanded={
              expandedRepository ===
              lcgRepository.name
            }
            onToggle={() =>
              setExpandedRepository(
                expandedRepository ===
                  lcgRepository.name
                  ? null
                  : lcgRepository.name
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
              handleKernelChange
            }
            kernelRefresh={
              kernelRefresh
            }
          />

        </div>
      )}


      {/* OTHER SOURCES */}

      <div className="cvmfs-repository-list">

        {repositories
          .filter(
            repository =>
              repository.name !==
              'LCG Releases'
          )
          .map(repository => (
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
              onKernelChange={
                handleKernelChange
              }
              kernelRefresh={
                kernelRefresh
              }
            />
          ))}

      </div>

    </div>
  );
}