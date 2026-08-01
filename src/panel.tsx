import { ReactWidget } from '@jupyterlab/ui-components';
import * as React from 'react';
import { SoftwarePanel } from './components/SoftwarePanel';

interface Software {
  package: string;
  description: string;
  defaultVersionName: string;
  url: string;

  platforms: string[];
  selectedPlatform: string | null;
}
export class CvmfsPanel extends ReactWidget {
  constructor(private software: Software[]) {
    super();

    this.id = 'cvmfs-panel';
    this.title.label = 'CVMFS';
    this.title.caption = 'CVMFS Software Explorer';
    this.addClass('cvmfs-panel');
  }

  render(): React.ReactElement {
    return <SoftwarePanel software={this.software} />;
  }
}