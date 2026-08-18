import * as React from 'react';

import { JupyterFrontEnd } from '@jupyterlab/application';

import {
  KernelSpec,
  ServerConnection
} from '@jupyterlab/services';

import { requestAPI } from '../request';

interface KernelInfo {
  kernel_name: string;
  display_name: string;
  modules: string[];
  platform: string;
  available: boolean;
}

interface Props {
  serverSettings: ServerConnection.ISettings;
  kernelSpecManager: KernelSpec.IManager;
  app: JupyterFrontEnd;
  refresh: number;
  onKernelChange: () => void;
}

export function ActiveModules({
  serverSettings,
  kernelSpecManager,
  app,
  refresh,
  onKernelChange
}: Props) {
  const [expanded, setExpanded] =
    React.useState(false);

  const [kernels, setKernels] =
    React.useState<KernelInfo[]>([]);

  const [loadingKernel, setLoadingKernel] =
    React.useState<string | null>(null);

  const loadKernels = async () => {
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
        'Failed to load active modules:',
        error
      );
    }
  };

  React.useEffect(() => {
    loadKernels();
  }, [
    serverSettings,
    refresh
  ]);

  const handleDeactivate = async (
    kernel: KernelInfo
  ) => {
    if (loadingKernel) {
      return;
    }

    setLoadingKernel(
      kernel.kernel_name
    );

    try {
      await requestAPI(
        `kernels/${kernel.kernel_name}`,
        serverSettings,
        {
          method: 'DELETE'
        }
      );

      await kernelSpecManager.refreshSpecs();

      await loadKernels();

      onKernelChange();

    } catch (error) {
      console.error(
        'Failed to deactivate module:',
        error
      );
    } finally {
      setLoadingKernel(null);
    }
  };

  const handleOpenTerminal = async (
    kernel: KernelInfo
  ) => {
    if (loadingKernel) {
      return;
    }

    setLoadingKernel(
      kernel.kernel_name
    );

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
              modules: kernel.modules,
              platform: kernel.platform
            }),

            headers: {
              'Content-Type':
                'application/json'
            }
          }
        );

      await app.commands.execute(
        'terminal:open',
        {
          name: data.name
        }
      );

    } catch (error) {
      console.error(
        'Failed to open terminal:',
        error
      );
    } finally {
      setLoadingKernel(null);
    }
  };

  return (
    <div className="cvmfs-active-modules">

      <button
        type="button"
        className="cvmfs-active-modules-header"
        onClick={() =>
          setExpanded(!expanded)
        }
        aria-expanded={expanded}
      >
        <span className="cvmfs-expand-icon">
          {expanded ? '▼' : '▶'}
        </span>

        <span className="cvmfs-active-modules-title">
          Active Modules
        </span>

        <span className="cvmfs-active-modules-count">
          {kernels.length}
        </span>
      </button>

      {expanded && (
        <div className="cvmfs-active-modules-content">

          {kernels.length === 0 ? (
            <span className="cvmfs-no-active-modules">
              No active modules
            </span>
          ) : (
            kernels.map(kernel => {

              const busy =
                loadingKernel ===
                kernel.kernel_name;

              return (
                <div
                  key={kernel.kernel_name}
                  className="cvmfs-active-module"
                >

                  <span
                    className="cvmfs-active-dot"
                  />

                  <div
                    className="cvmfs-active-module-info"
                  >

                    <strong>
                      {kernel.modules.join(', ')}
                    </strong>

                    <code>
                      {kernel.platform}
                    </code>

                    <div
                      className="cvmfs-active-module-actions"
                    >

                      <button
                        type="button"
                        className="cvmfs-active-terminal-button"
                        disabled={busy}
                        onClick={() =>
                          handleOpenTerminal(
                            kernel
                          )
                        }
                      >
                        {busy
                          ? 'Opening...'
                          : 'Open Terminal'}
                      </button>

                      <button
                        type="button"
                        className="cvmfs-active-deactivate-button"
                        disabled={busy}
                        onClick={() =>
                          handleDeactivate(
                            kernel
                          )
                        }
                      >
                        {busy
                          ? 'Working...'
                          : 'Deactivate'}
                      </button>

                    </div>

                  </div>

                </div>
              );
            })
          )}

        </div>
      )}

    </div>
  );
}