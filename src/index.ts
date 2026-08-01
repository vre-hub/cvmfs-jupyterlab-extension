import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './request';
import { CvmfsPanel } from './panel';

interface Software {
  package: string;
  description: string;
  defaultVersionName: string;
  url: string;

  platforms: string[];
  selectedPlatform: string | null;
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'cvmfs_extension:plugin',
  autoStart: true,

  activate: async (app: JupyterFrontEnd) => {
    console.log('CVMFS extension activated');

    try {
      const data = await requestAPI<Software[]>(
        'catalog',
        app.serviceManager.serverSettings
      );

      console.log('Catalog:', data);

      const panel = new CvmfsPanel(data);

      app.shell.add(panel, 'left', {
        rank: 600
      });
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    }
  }
};

export default plugin;