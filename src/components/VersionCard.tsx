import * as React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import {
  KernelSpec,
  ServerConnection
} from '@jupyterlab/services';

import { requestAPI } from '../request';

export interface Version {
  versionName: string;
  full: string;
  help: string;
  path: string;
  family?: string;
}

interface KernelInfo {
  kernel_name: string;
  display_name: string;
  modules: string[];
  platform: string;
  available: boolean;
}

interface PlatformInfo {
  architecture: string;
  os: string;
  available: string[];
  compatible: string[];
  selected: string;
}

interface Props {
  version: Version;
  category: string;
  isDefault: boolean;
  expanded: boolean;
  onToggle: () => void;
  serverSettings: ServerConnection.ISettings;
  kernelSpecManager: KernelSpec.IManager;
  app: JupyterFrontEnd;
}

export function VersionCard({
  version,
  category,
  isDefault,
  expanded,
  onToggle,
  serverSettings,
  kernelSpecManager,
  app
}: Props) {
  const [actionLoading, setActionLoading] =
    React.useState(false);

  const [action, setAction] =
    React.useState<
      'activate' | 'deactivate' | null
    >(null);

  const [kernelName, setKernelName] =
    React.useState<string | null>(null);

  const [justActivated, setJustActivated] =
    React.useState(false);

  const [platform, setPlatform] =
    React.useState<string | null>(null);

  const requestGeneration =
    React.useRef(0);

  React.useEffect(() => {
    const generation =
      ++requestGeneration.current;

    let cancelled = false;

    const loadStatus = async () => {
      try {
        const [
          platformData,
          kernelData
        ] = await Promise.all([
          requestAPI<PlatformInfo>(
            'platform',
            serverSettings
          ),

          requestAPI<{
            kernels: KernelInfo[];
          }>(
            'kernels',
            serverSettings
          )
        ]);

        if (
          cancelled ||
          generation !== requestGeneration.current
        ) {
          return;
        }

        const selectedPlatform =
          platformData.selected;

        setPlatform(selectedPlatform);

        const kernel =
          kernelData.kernels.find(
            kernel =>
              kernel.modules.includes(
                version.full
              ) &&
              kernel.platform ===
                selectedPlatform &&
              kernel.available
          );

        setKernelName(
          kernel
            ? kernel.kernel_name
            : null
        );

        setJustActivated(false);
      } catch (error) {
        if (
          !cancelled &&
          generation === requestGeneration.current
        ) {
          console.error(
            'Failed to check kernel status:',
            error
          );
        }
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [
    serverSettings,
    version.full
  ]);

  const handleActivate = async () => {
    if (!platform || actionLoading) {
      return;
    }

    requestGeneration.current++;

    setActionLoading(true);
    setAction('activate');
    setJustActivated(false);

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
              modules: [
                version.full
              ],

              platform: platform,

              display_name:
                `Python (${version.full} • ${platform})`
            }),

            headers: {
              'Content-Type':
                'application/json'
            }
          }
        );

      setKernelName(
        data.kernel_name
      );

      setJustActivated(true);

      /*
       * Tell JupyterLab that a new
       * kernelspec now exists.
       */
      await kernelSpecManager.refreshSpecs();

      console.log(
        'Kernel created:',
        data
      );
    } catch (error) {
      console.error(
        'Failed to activate module:',
        error
      );
    } finally {
      setActionLoading(false);
      setAction(null);
    }
  };

  const handleDeactivate = async () => {
    if (!kernelName || actionLoading) {
      return;
    }

    requestGeneration.current++;

    const kernelToRemove =
      kernelName;

    setActionLoading(true);
    setAction('deactivate');

    try {
      await requestAPI(
        `kernels/${kernelToRemove}`,
        serverSettings,
        {
          method: 'DELETE'
        }
      );

      setKernelName(null);
      setJustActivated(false);

      /*
       * Tell JupyterLab that the
       * kernelspec was removed.
       */
      await kernelSpecManager.refreshSpecs();

      console.log(
        'Kernel removed:',
        kernelToRemove
      );
    } catch (error) {
      console.error(
        'Failed to deactivate kernel:',
        error
      );
    } finally {
      setActionLoading(false);
      setAction(null);
    }
  };

  const handleOpenTerminal = async () => {
    if (
      !platform ||
      !kernelName ||
      actionLoading
    ) {
      return;
    }

    try {
      const data =
        await requestAPI<{
          name: string;
          status: string;
          modules: string[];
          platform: string;
        }>(
          'terminal',
          serverSettings,
          {
            method: 'POST',

            body: JSON.stringify({
              modules: [
                version.full
              ],

              platform
            }),

            headers: {
              'Content-Type':
                'application/json'
            }
          }
        );

      console.log(
        'Terminal created:',
        data
      );

      /*
       * The backend creates the terminal
       * and returns its JupyterLab terminal
       * name.
       *
       * Now ask JupyterLab to open that
       * existing terminal.
       */
      await app.commands.execute(
        'terminal:open',
        {
          name: data.name
        }
      );

      console.log(
        'Terminal opened:',
        data.name
      );
    } catch (error) {
      console.error(
        'Failed to create/open terminal:',
        error
      );
    }
  };

  return (
    <>
      <button
        className="version-header"
        onClick={onToggle}
      >
        {expanded ? '▼' : '▶'}{' '}
        {version.versionName}

        {isDefault &&
          ' (default)'}
      </button>

      {expanded && (
        <div className="version-details">

          <p>
            <b>Category</b>
          </p>

          <p>
            {category}
          </p>

          <p>
            <b>Module</b>
          </p>

          <p>
            {version.full}
          </p>

          <p>
            <b>Platform</b>
          </p>

          <p>
            {platform ??
              'Detecting...'}
          </p>

          <p>
            <b>Help</b>
          </p>

          <pre>
            {version.help}
          </pre>

          <p>
            <b>Modulefile</b>
          </p>

          <p>
            {version.path}
          </p>

          <button
            disabled={
              actionLoading ||
              !platform
            }

            onClick={
              kernelName
                ? handleDeactivate
                : handleActivate
            }
          >
            {actionLoading
              ? action ===
                'deactivate'
                ? 'Deactivating...'
                : 'Activating...'
              : kernelName
                ? 'Deactivate'
                : 'Activate'}
          </button>

          <button
            onClick={
              handleOpenTerminal
            }

            disabled={
              !platform ||
              !kernelName ||
              actionLoading
            }
          >
            Open Terminal
          </button>

          {justActivated && (
            <p>
              <b>
                Kernel ready.
              </b>{' '}

              Select{' '}

              {`Python (${version.full} • ${platform})`}{' '}

              from the kernel picker.
            </p>
          )}

        </div>
      )}
    </>
  );
}