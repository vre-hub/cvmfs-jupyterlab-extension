import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

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

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cvmfs_extension:plugin',
  autoStart: true,

  activate: async (app: JupyterFrontEnd) => {
    const serverSettings =
      app.serviceManager.serverSettings;

    try {
      const platform =
        await requestAPI<PlatformInfo>(
          'platform',
          serverSettings
        );

      const catalog =
        await requestAPI<CatalogResponse>(
          `catalog?platform=${platform.selected}`,
          serverSettings
        );

      const panel = new CvmfsPanel({
        repositories: catalog.repositories,
        platform,
        serverSettings,
        kernelSpecManager:
          app.serviceManager.kernelspecs,
        app
      });

      app.shell.add(panel, 'left', {
        rank: 600
      });
    } catch (err) {
      console.error(err);
    }
  }
};

export default plugin;