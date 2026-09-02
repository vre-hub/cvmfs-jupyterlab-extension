import * as React from 'react';

import {
  render,
  screen,
  fireEvent,
  waitFor
} from '@testing-library/react';

import '@testing-library/jest-dom';

import { SearchBar } from '../components/SearchBar';
import { PlatformSelector } from '../components/PlatformSelector';
import { SoftwarePanel } from '../components/SoftwarePanel';

import { requestAPI } from '../request';

jest.mock('../request', () => ({
  requestAPI: jest.fn()
}));

const mockedRequestAPI =
  requestAPI as jest.MockedFunction<
    typeof requestAPI
  >;

const serverSettings =
  {} as any;

const kernelSpecManager =
  {
    refreshSpecs: jest.fn()
  } as any;

const app =
  {
    commands: {
      execute: jest.fn()
    }
  } as any;

const platform = {
  architecture: 'x86_64',
  os: 'el9',
  available: [
    'x86_64-el9-gcc14-opt'
  ],
  compatible: [
    'x86_64-el9-gcc14-opt'
  ],
  selected:
    'x86_64-el9-gcc14-opt'
};

const repositories = [
  {
    name: 'LCG Releases',
    packages: [
      {
        package: 'ROOT',
        categories: 'HEP',
        defaultVersionName: '6.30.06',
        versions: [
          {
            versionName: '6.30.06',
            full:
              'ROOT/6.30.06',
            help:
              'ROOT data analysis framework',
            path:
              '/modules/ROOT/6.30.06'
          }
        ]
      }
    ]
  }
];

beforeEach(() => {
  jest.clearAllMocks();
});


describe('SearchBar', () => {
  it('renders the search input', () => {
    render(
      <SearchBar
        query=""
        onChange={jest.fn()}
      />
    );

    expect(
      screen.getByPlaceholderText(
        'Search packages...'
      )
    ).toBeInTheDocument();
  });

  it('calls onChange when the query changes', () => {
    const onChange =
      jest.fn();

    render(
      <SearchBar
        query=""
        onChange={onChange}
      />
    );

    const input =
      screen.getByPlaceholderText(
        'Search packages...'
      );

    fireEvent.change(
      input,
      {
        target: {
          value: 'ROOT'
        }
      }
    );

    expect(onChange).toHaveBeenCalledWith(
      'ROOT'
    );
  });
});


describe('PlatformSelector', () => {
  it('renders available platforms', () => {
    render(
      <PlatformSelector
        platforms={[
          'platform-a',
          'platform-b'
        ]}
        selected="platform-a"
        onChange={jest.fn()}
      />
    );

    expect(
      screen.getByRole('option', {
        name: 'platform-a'
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('option', {
        name: 'platform-b'
      })
    ).toBeInTheDocument();
  });

  it('calls onChange when platform changes', () => {
    const onChange =
      jest.fn();

    render(
      <PlatformSelector
        platforms={[
          'platform-a',
          'platform-b'
        ]}
        selected="platform-a"
        onChange={onChange}
      />
    );

    fireEvent.change(
      screen.getByRole('combobox'),
      {
        target: {
          value: 'platform-b'
        }
      }
    );

    expect(onChange).toHaveBeenCalledWith(
      'platform-b'
    );
  });
});


describe('SoftwarePanel collections', () => {
  const collections = [
    {
      name: 'EESSI Python',
      description:
        'Python environment from EESSI.',
      modules: [
        'Python/3.11.3-GCCcore-12.3.0'
      ]
    }
  ];

  beforeEach(() => {
    mockedRequestAPI.mockImplementation(
      async (url: string) => {
        if (url === 'collections') {
          return {
            collections
          } as any;
        }

        if (url === 'kernels') {
          return {
            kernels: []
          } as any;
        }

        if (url === 'platform') {
          return platform as any;
        }

        return {
          repositories
        } as any;
      }
    );
  });

  it('renders the collection returned by the backend', async () => {
    render(
      <SoftwarePanel
        initialRepositories={
          repositories
        }
        initialPlatform={
          platform
        }
        serverSettings={
          serverSettings
        }
        kernelSpecManager={
          kernelSpecManager
        }
        app={app}
      />
    );

    expect(
      await screen.findByText(
        'EESSI Python'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Python/3.11.3-GCCcore-12.3.0'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: 'Activate'
      })
    ).toBeInTheDocument();
  });


  it('activates a collection', async () => {
    mockedRequestAPI.mockImplementation(
      async (url: string) => {
        if (url === 'collections') {
          return {
            collections
          } as any;
        }

        if (url === 'kernels') {
          return {
            kernels: []
          } as any;
        }

        if (url === 'activate') {
          return {
            status: 'ok',
            kernel_name:
              'cvmfs-eessi-python',
            display_name:
              'EESSI Python'
          } as any;
        }

        return repositories as any;
      }
    );

    render(
      <SoftwarePanel
        initialRepositories={
          repositories
        }
        initialPlatform={
          platform
        }
        serverSettings={
          serverSettings
        }
        kernelSpecManager={
          kernelSpecManager
        }
        app={app}
      />
    );

    const button =
      await screen.findByRole(
        'button',
        {
          name: 'Activate'
        }
      );

    fireEvent.click(button);

    await waitFor(() => {
      expect(
        mockedRequestAPI
      ).toHaveBeenCalledWith(
        'activate',
        serverSettings,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            modules: [
              'Python/3.11.3-GCCcore-12.3.0'
            ],
            platform:
              'x86_64-el9-gcc14-opt',
            display_name:
              'EESSI Python'
          }),
          headers: {
            'Content-Type':
              'application/json'
          }
        })
      );
    });

    expect(
      kernelSpecManager.refreshSpecs
    ).toHaveBeenCalled();
  });


  it('shows Deactivate for an active collection', async () => {
    mockedRequestAPI.mockImplementation(
      async (url: string) => {
        if (url === 'collections') {
          return {
            collections
          } as any;
        }

        if (url === 'kernels') {
          return {
            kernels: [
              {
                kernel_name:
                  'cvmfs-eessi-python',
                display_name:
                  'EESSI Python',
                modules: [
                  'Python/3.11.3-GCCcore-12.3.0'
                ],
                platform:
                  'x86_64-el9-gcc14-opt',
                available: true
              }
            ]
          } as any;
        }

        return repositories as any;
      }
    );

    render(
      <SoftwarePanel
        initialRepositories={
          repositories
        }
        initialPlatform={
          platform
        }
        serverSettings={
          serverSettings
        }
        kernelSpecManager={
          kernelSpecManager
        }
        app={app}
      />
    );

    expect(
      await screen.findByRole(
        'button',
        {
          name: 'Deactivate'
        }
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByRole(
        'button',
        {
          name: 'Activate'
        }
      )
    ).not.toBeInTheDocument();
  });


  it('deactivates an active collection', async () => {
    mockedRequestAPI.mockImplementation(
      async (url: string) => {
        if (url === 'collections') {
          return {
            collections
          } as any;
        }

        if (url === 'kernels') {
          return {
            kernels: [
              {
                kernel_name:
                  'cvmfs-eessi-python',
                display_name:
                  'EESSI Python',
                modules: [
                  'Python/3.11.3-GCCcore-12.3.0'
                ],
                platform:
                  'x86_64-el9-gcc14-opt',
                available: true
              }
            ]
          } as any;
        }

        if (
          url ===
          'kernels/cvmfs-eessi-python'
        ) {
          return {
            status: 'ok'
          } as any;
        }

        return repositories as any;
      }
    );

    render(
      <SoftwarePanel
        initialRepositories={
          repositories
        }
        initialPlatform={
          platform
        }
        serverSettings={
          serverSettings
        }
        kernelSpecManager={
          kernelSpecManager
        }
        app={app}
      />
    );

    const button =
      await screen.findByRole(
        'button',
        {
          name: 'Deactivate'
        }
      );

    fireEvent.click(button);

    await waitFor(() => {
      expect(
        mockedRequestAPI
      ).toHaveBeenCalledWith(
        'kernels/cvmfs-eessi-python',
        serverSettings,
        {
          method: 'DELETE'
        }
      );
    });

    expect(
      kernelSpecManager.refreshSpecs
    ).toHaveBeenCalled();
  });
});


describe('cvmfs_extension', () => {
  it('has a working Jest test environment', () => {
    expect(1 + 1).toEqual(2);
  });
});