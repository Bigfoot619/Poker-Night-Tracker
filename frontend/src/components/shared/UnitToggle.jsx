export function UnitToggle({ unit, onChange }) {
  return (
    <div className="unit-toggle">
      <button
        type="button"
        className={unit === 'cash' ? 'active' : ''}
        onClick={() => onChange('cash')}
      >
        Cash
      </button>
      <button
        type="button"
        className={unit === 'chips' ? 'active' : ''}
        onClick={() => onChange('chips')}
      >
        Chips
      </button>
    </div>
  );
}
