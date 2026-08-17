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

  /*
   * Check whether this module already has
   * an active kernel for the selected platform.
   */
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
          generation !==
            requestGeneration.current
        ) {
          return;
        }

        const selectedPlatform =
          platformData.selected;

        setPlatform(
          selectedPlatform
        );

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
          generation ===
            requestGeneration.current
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

  /*
   * Activate module and create kernel.
   */
  const handleActivate = async () => {
    if (
      !platform ||
      actionLoading
    ) {
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

              platform,

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

  /*
   * Remove the kernel associated with
   * this module.
   */
  const handleDeactivate = async () => {
    if (
      !kernelName ||
      actionLoading
    ) {
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

  /*
   * Create a terminal with the selected
   * module environment and open it.
   */
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
       * and returns its JupyterLab name.
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
    <div
      className={`cvmfs-version ${
        expanded
          ? 'cvmfs-version-expanded'
          : ''
      }`}
    >

      {/* =================================================
          VERSION HEADER
          ================================================= */}

      <button
        type="button"
        className="cvmfs-version-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >

        <span className="cvmfs-expand-icon">
          {expanded ? '▼' : '▶'}
        </span>

        <span className="cvmfs-version-name">
          {version.versionName}
        </span>

        {isDefault && (
          <span className="cvmfs-default-badge">
            default
          </span>
        )}

        {kernelName && (
          <span className="cvmfs-active-badge">
            kernel active
          </span>
        )}

      </button>


      {/* =================================================
          VERSION DETAILS
          ================================================= */}

      {expanded && (
        <div className="cvmfs-version-details">

          {/* ---------------------------------------------
              Metadata
              --------------------------------------------- */}

          <div className="cvmfs-version-meta">

            <span>
              <strong>
                Category:
              </strong>{' '}

              {category}
            </span>

            <span>
              <strong>
                Module:
              </strong>{' '}

              <code>
                {version.full}
              </code>
            </span>

            <span>
              <strong>
                Platform:
              </strong>{' '}

              <code>
                {platform ??
                  'Detecting...'}
              </code>
            </span>

            {kernelName && (
              <span>
                <strong>
                  Kernel:
                </strong>{' '}

                <code>
                  {kernelName}
                </code>
              </span>
            )}

          </div>


          {/* ---------------------------------------------
              Description
              --------------------------------------------- */}

          {version.help && (
            <div className="cvmfs-version-description">

              <strong>
                Description:
              </strong>{' '}

              <span>
                {version.help
                  .replace(
                    /\s+/g,
                    ' '
                  )
                  .trim()}
              </span>

            </div>
          )}


          {/* ---------------------------------------------
              Modulefile
              --------------------------------------------- */}

          <div className="cvmfs-modulefile">

            <strong>
              Modulefile:
            </strong>

            <code
              title={version.path}
            >
              {version.path}
            </code>

          </div>


          {/* ---------------------------------------------
              Actions
              --------------------------------------------- */}

          <div className="cvmfs-actions">

            <button
              type="button"
              className={
                kernelName
                  ? 'cvmfs-button cvmfs-button-danger'
                  : 'cvmfs-button cvmfs-button-primary'
              }
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
                ? action === 'deactivate'
                  ? 'Deactivating...'
                  : 'Activating...'
                : kernelName
                  ? 'Deactivate'
                  : 'Activate'}
            </button>


            <button
              type="button"
              className="cvmfs-button cvmfs-button-terminal"
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

          </div>


          {/* ---------------------------------------------
              Activation success
              --------------------------------------------- */}

          {justActivated && (
            <div className="cvmfs-success">

              <strong>
                Kernel ready.
              </strong>

              <span>
                Select{' '}

                <strong>
                  {`Python (${version.full} • ${platform})`}
                </strong>{' '}

                from the JupyterLab
                kernel picker.
              </span>

            </div>
          )}

        </div>
      )}

    </div>
  );
}