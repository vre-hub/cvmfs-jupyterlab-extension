import { ReactWidget } from '@jupyterlab/ui-components';
import { ServerConnection } from '@jupyterlab/services';
import * as React from 'react';

import { SoftwarePanel } from './components/SoftwarePanel';

interface PlatformInfo {
  architecture: string;
  os: string;
  available: string[];
  compatible: string[];
  selected: string;
}

interface Repository {
  name: string;
  packages: any[];
}

interface Props {
  repositories: Repository[];
  platform: PlatformInfo;
  serverSettings: ServerConnection.ISettings;
}

export class CvmfsPanel extends ReactWidget {

  constructor(private props: Props) {
    super();

    this.id = 'cvmfs-panel';
    this.title.label = 'CVMFS';
    this.title.caption = 'CVMFS Software Explorer';
    this.addClass('cvmfs-panel');
  }

  render(): React.ReactElement {
    return (
      <SoftwarePanel
        initialRepositories={this.props.repositories}
        initialPlatform={this.props.platform}
        serverSettings={this.props.serverSettings}
      />
    );
  }
}