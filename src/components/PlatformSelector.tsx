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
    <div className="cvmfs-platform-selector">

      <label
        htmlFor="cvmfs-platform-select"
        className="cvmfs-control-label"
      >
        Software stack
      </label>

      <select
        id="cvmfs-platform-select"
        className="cvmfs-platform-select"
        value={selected}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
      >

        {platforms.map(platform => (
          <option
            key={platform}
            value={platform}
          >
            {platform}
          </option>
        ))}

      </select>

    </div>
  );
}