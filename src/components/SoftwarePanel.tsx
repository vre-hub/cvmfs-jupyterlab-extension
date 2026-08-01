import * as React from 'react';

interface Software {
  package: string;
  description: string;
  defaultVersionName: string;
  url: string;

  platforms: string[];
  selectedPlatform: string | null;
}

interface Props {
  software: Software[];
}

export function SoftwarePanel({ software }: Props) {
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const filtered = software
    .filter(item => item.package.startsWith("LCG_"))
    .filter(item =>
      item.package.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="cvmfs-container">
      <h2>CVMFS Software Explorer</h2>

      <input
        className="search-box"
        type="text"
        placeholder="Search software..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <h3>Available Software ({filtered.length})</h3>

      <div className="software-list">
        {filtered.length === 0 ? (
          <p>No matching software found.</p>
        ) : (
          filtered.map(item => (
            <div key={item.package} className="software-card">

              <button
                className="software-header"
                onClick={() =>
                  setExpanded(expanded === item.package ? null : item.package)
                }
              >
                {expanded === item.package ? "▼" : "▶"} {item.package}
              </button>

              {expanded === item.package && (
  <div className="software-details">

    <p>
      <b>Selected Platform</b>
    </p>

    <p>{item.selectedPlatform ?? "No compatible platform found"}</p>

    <p>
      <b>Available Platforms</b>
    </p>

    <ul>
      {item.platforms.map(platform => (
        <li key={platform}>{platform}</li>
      ))}
    </ul>

    <p>
      <b>Packages</b>
    </p>

    <p>Loading...</p>

  </div>
)}

            </div>
          ))
        )}
      </div>
    </div>
  );
}