import * as React from 'react';

interface Props {
  query: string;
  onChange: (query: string) => void;
}

export function SearchBar({
  query,
  onChange
}: Props) {
  return (
    <div className="cvmfs-search">

      <label
        htmlFor="cvmfs-search-input"
        className="cvmfs-control-label"
      >
        Search
      </label>

      <div className="cvmfs-search-wrapper">

        <input
          id="cvmfs-search-input"
          type="text"
          className="cvmfs-search-input"
          placeholder="Search packages..."
          value={query}
          onChange={e =>
            onChange(e.target.value)
          }
        />

      </div>

    </div>
  );
}