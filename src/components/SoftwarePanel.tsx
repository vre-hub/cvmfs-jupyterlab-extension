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

interface Collection {
  name: string;
  description: string;
  modules: string[];
}

interface KernelInfo {
  kernel_name: string;
  display_name: string;
  modules: string[];
  platform: string;
  available: boolean;
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

  const [kernelRefresh, setKernelRefresh] =
    React.useState(0);

  const [error, setError] =
    React.useState<string | null>(
      initialError ?? null
    );

  const [collections, setCollections] =
    React.useState<Collection[]>([]);

  const [kernels, setKernels] =
    React.useState<KernelInfo[]>([]);

  const [collectionLoading, setCollectionLoading] =
    React.useState<string | null>(null);

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
      return (
        'Could not connect to the CVMFS backend. ' +
        'Please check that the server is available.'
      );
    }

    if (error instanceof Error) {
      return error.message || fallback;
    }

    return fallback;
  };

  /*
   * Load curated software collections.
   */
  React.useEffect(() => {
    const loadCollections = async () => {
      try {
        const response =
          await requestAPI<{
            collections: Collection[];
          }>(
            'collections',
            serverSettings
          );

        setCollections(
          response.collections
        );

      } catch (error) {
        console.error(
          'Failed to load collections:',
          error
        );
      }
    };

    loadCollections();
  }, [serverSettings]);

  /*
   * Load currently available CVMFS kernels.
   *
   * Collections use the same kernel list as
   * ActiveModules and VersionCard.
   */
  const loadKernels = React.useCallback(
    async () => {
      try {
        const response =
          await requestAPI<{
            kernels: KernelInfo[];
          }>(
            'kernels',
            serverSettings
          );

        setKernels(
          response.kernels.filter(
            kernel => kernel.available
          )
        );

      } catch (error) {
        console.error(
          'Failed to load kernels:',
          error
        );
      }
    },
    [serverSettings]
  );

  React.useEffect(() => {
    loadKernels();
  }, [
    loadKernels,
    kernelRefresh
  ]);

  /*
   * Find the kernel corresponding to a collection.
   *
   * A collection is considered active only when:
   *
   * 1. The platform matches.
   * 2. The kernel contains exactly the collection
   *    modules.
   *
   * Sorting makes the comparison independent
   * of module ordering.
   */
  const getCollectionKernel = (
    collection: Collection
  ): KernelInfo | null => {
    const collectionModules =
      [...collection.modules].sort();

    return (
      kernels.find(kernel => {
        if (
          kernel.platform !==
          platform.selected
        ) {
          return false;
        }

        const kernelModules =
          [...kernel.modules].sort();

        if (
          kernelModules.length !==
          collectionModules.length
        ) {
          return false;
        }

        return kernelModules.every(
          (module, index) =>
            module ===
            collectionModules[index]
        );
      }) ?? null
    );
  };

  /*
   * Activate a complete collection.
   */
  const handleActivateCollection = async (
    collection: Collection
  ) => {
    if (
      collectionLoading !== null
    ) {
      return;
    }

    setError(null);

    setCollectionLoading(
      collection.name
    );

    try {
      const data =
        await requestAPI<{
          kernel_name: string;
          display_name: string;
        }>(
          'activate',
          serverSettings,
          {
            method: 'POST',

            body: JSON.stringify({
              modules:
                collection.modules,

              platform:
                platform.selected,

              display_name:
                collection.name
            }),

            headers: {
              'Content-Type':
                'application/json'
            }
          }
        );

      console.log(
        'Collection activated:',
        data
      );

      await kernelSpecManager.refreshSpecs();

      await loadKernels();

      handleKernelChange();

    } catch (error) {
      console.error(
        'Failed to activate collection:',
        error
      );

      setError(
        `Collection activation failed: ${getErrorMessage(
          error,
          `could not activate ${collection.name}.`
        )}`
      );

    } finally {
      setCollectionLoading(null);
    }
  };

  /*
   * Deactivate the kernel belonging to
   * a collection.
   */
  const handleDeactivateCollection = async (
    collection: Collection,
    kernel: KernelInfo
  ) => {
    if (
      collectionLoading !== null
    ) {
      return;
    }

    setError(null);

    setCollectionLoading(
      collection.name
    );

    try {
      await requestAPI(
        `kernels/${kernel.kernel_name}`,
        serverSettings,
        {
          method: 'DELETE'
        }
      );

      console.log(
        'Collection deactivated:',
        collection.name
      );

      await kernelSpecManager.refreshSpecs();

      await loadKernels();

      handleKernelChange();

    } catch (error) {
      console.error(
        'Failed to deactivate collection:',
        error
      );

      setError(
        `Collection deactivation failed: ${getErrorMessage(
          error,
          `could not deactivate ${collection.name}.`
        )}`
      );

    } finally {
      setCollectionLoading(null);
    }
  };

  /*
   * Change selected platform and reload
   * its catalogue.
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
        repository.name ===
        'LCG Releases'
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


      {/* COLLECTIONS */}

      {collections.length > 0 && (
        <div className="cvmfs-collections">

          <div className="cvmfs-collections-header">

            <strong>
              Collections
            </strong>

            <span>
              Curated software environments
            </span>

          </div>


          <div className="cvmfs-collections-list">

            {collections.map(
              collection => {

                const activeKernel =
                  getCollectionKernel(
                    collection
                  );

                const isActive =
                  activeKernel !== null;

                const loading =
                  collectionLoading ===
                  collection.name;

                return (
                  <div
                    key={
                      collection.name
                    }
                    className={
                      `cvmfs-collection ${
                        isActive
                          ? 'cvmfs-collection-active'
                          : ''
                      }`
                    }
                  >

                    <div className="cvmfs-collection-info">

                      <div className="cvmfs-collection-title">

                        <strong>
                          {collection.name}
                        </strong>

                        {isActive && (
                          <span className="cvmfs-active-badge">
                            active
                          </span>
                        )}

                      </div>

                      <span>
                        {
                          collection.description
                        }
                      </span>

                      <div className="cvmfs-collection-modules">

                        {collection.modules.map(
                          module => (
                            <code
                              key={module}
                            >
                              {module}
                            </code>
                          )
                        )}

                      </div>

                    </div>


                    <button
                      type="button"
                      className={
                        isActive
                          ? 'cvmfs-button cvmfs-button-danger'
                          : 'cvmfs-button cvmfs-button-primary'
                      }
                      disabled={
                        collectionLoading !==
                        null
                      }
                      onClick={() => {

                        if (
                          activeKernel
                        ) {
                          handleDeactivateCollection(
                            collection,
                            activeKernel
                          );
                        } else {
                          handleActivateCollection(
                            collection
                          );
                        }

                      }}
                    >

                      {loading
                        ? isActive
                          ? 'Deactivating...'
                          : 'Activating...'
                        : isActive
                          ? 'Deactivate'
                          : 'Activate'}

                    </button>

                  </div>
                );
              }
            )}

          </div>

        </div>
      )}


      {/* ACTIVE MODULES */}

      <ActiveModules
        serverSettings={
          serverSettings
        }
        kernelSpecManager={
          kernelSpecManager
        }
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
            repository={
              lcgRepository
            }
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
              key={
                repository.name
              }
              repository={
                repository
              }
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