import * as React from 'react';

interface Props {
  platforms: string[];
  selected: string;
  onChange: (platform: string) => void;
}

export function PlatformSelector({
  platforms,
  selected,
  onChange
}: Props) {
  return (
    <div className="platform-selector">
      <label>
        <b>Platform</b>
      </label>

      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
      >
        {platforms.map(platform => (
          <option key={platform} value={platform}>
            {platform}
          </option>
        ))}
      </select>
    </div>
  );
}