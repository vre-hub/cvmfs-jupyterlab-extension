import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ServerConnection } from '@jupyterlab/services';
import { requestAPI } from './request';
import { CvmfsPanel } from './panel';

import '../style/index.css';

interface Repository {
  name: string;
  packages: any[];
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

const emptyPlatform: PlatformInfo = {
  architecture: '',
  os: '',
  available: [],
  compatible: [],
  selected: ''
};

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cvmfs_extension:plugin',
  autoStart: true,

  activate: async (app: JupyterFrontEnd) => {
    const serverSettings =
      app.serviceManager.serverSettings;

    let platform: PlatformInfo =
      emptyPlatform;

    let repositories: Repository[] = [];

    let initialError:
      string | null = null;

    const getErrorMessage = (
      error: unknown,
      fallback: string
    ): string => {
      if (
        error instanceof
        ServerConnection.ResponseError
      ) {
        return (
          error.message ||
          fallback
        );
      }

      if (
        error instanceof
        ServerConnection.NetworkError
      ) {
        return 'Could not connect to the CVMFS backend. Please check that the server is available.';
      }

      if (error instanceof Error) {
        return (
          error.message ||
          fallback
        );
      }

      return fallback;
    };

    try {
      platform =
        await requestAPI<PlatformInfo>(
          'platform',
          serverSettings
        );
    } catch (error) {
      console.error(
        'Failed to load platform:',
        error
      );

      initialError =
        `Unable to load CVMFS software: ${getErrorMessage(
          error,
          'Could not determine a compatible platform. Please check that CVMFS/Lmod is available.'
        )}`;
    }

    if (!initialError) {
      try {
        const catalog =
          await requestAPI<CatalogResponse>(
            `catalog?platform=${encodeURIComponent(
              platform.selected
            )}`,
            serverSettings
          );

        repositories =
          catalog.repositories;

      } catch (error) {
        console.error(
          'Failed to load catalog:',
          error
        );

        initialError =
          `Unable to load CVMFS software: ${getErrorMessage(
            error,
            'Could not load the software catalogue. Please check that CVMFS/Lmod is available.'
          )}`;
      }
    }

    const panel = new CvmfsPanel({
      repositories,
      platform,
      serverSettings,
      kernelSpecManager:
        app.serviceManager.kernelspecs,
      app,
      initialError
    });

    app.shell.add(panel, 'left', {
      rank: 600
    });
  }
};

export default plugin;