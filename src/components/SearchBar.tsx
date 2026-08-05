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
    <div className="search-bar">
      <label>
        <b>Search</b>
      </label>

      <input
        type="text"
        placeholder="Search packages..."
        value={query}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}