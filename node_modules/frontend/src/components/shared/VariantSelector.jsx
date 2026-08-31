import { GAME_VARIANTS } from '../../constants.js';

export function VariantSelector({ value, onChange, includeAll = false }) {
  const options = includeAll ? ['all', ...GAME_VARIANTS] : GAME_VARIANTS;
  return (
    <div className="sort-tabs">
      {options.map((v) => (
        <button
          key={v}
          type="button"
          className={value === v ? 'active' : ''}
          onClick={() => onChange(v)}
        >
          {v === 'all' ? 'All Variants' : v}
        </button>
      ))}
    </div>
  );
}
