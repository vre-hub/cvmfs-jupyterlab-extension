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
  initialError?: string | null;
}

export function SoftwarePanel({
  initialRepositories,
  initialPlatform,
  serverSettings,
  kernelSpecManager,
  app,
  initialError
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

  const [error, setError] =
    React.useState<string | null>(
      initialError ?? null
    );

  const handleKernelChange = () => {
    setKernelRefresh(
      value => value + 1
    );
  };

  /*
   * Extract a user-friendly message without
   * exposing backend tracebacks.
   */
  const getErrorMessage = (
    error: unknown,
    fallback: string
  ): string => {
    if (
      error instanceof ServerConnection.ResponseError
    ) {
      return error.message || fallback;
    }

    if (
      error instanceof ServerConnection.NetworkError
    ) {
      return 'Could not connect to the CVMFS backend. Please check that the server is available.';
    }

    if (error instanceof Error) {
      return error.message || fallback;
    }

    return fallback;
  };

  /*
   * Change the selected LCG platform and
   * reload its catalogue.
   */
  const changePlatform = async (
    newPlatform: string
  ) => {
    setError(null);

    try {
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

    } catch (error) {
      console.error(
        'Failed to switch platform:',
        error
      );

      setError(
        `Unable to switch platform: ${getErrorMessage(
          error,
          `failed to load the catalogue for ${newPlatform}.`
        )}`
      );
    }
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
        onKernelChange={
          handleKernelChange
        }
      />


      {/* ERROR */}

      {error && (
        <div
          className="cvmfs-error"
          role="alert"
        >
          <strong>
            Error:
          </strong>{' '}

          <span>
            {error}
          </span>
        </div>
      )}


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