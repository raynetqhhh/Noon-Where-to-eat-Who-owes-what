import { DIETARY, MOODS } from '../../utils/dietary.js';
import { Chip } from './Badge.jsx';

/** Multi-select chips. options: 'dietary' | 'moods' | 'all' */
export default function DietaryPicker({ value, onChange, options = 'dietary', label }) {
  const list = options === 'moods' ? MOODS : options === 'all' ? [...DIETARY, ...MOODS] : DIETARY;
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <fieldset>
      {label && <legend className="mb-2 text-sm font-medium">{label}</legend>}
      <div className="flex flex-wrap gap-2">
        {list.map((t) => (
          <Chip key={t.id} pressed={value.includes(t.id)} onClick={() => toggle(t.id)}>
            <span aria-hidden>{t.emoji}</span>
            {t.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
