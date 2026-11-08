import Modal from '../ui/Modal.jsx';

export default function ShortcutHelp({ open, onClose, shortcuts }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="sm">
      <dl className="divide-y divide-line">
        {shortcuts.map(([keys, label]) => (
          <div key={keys} className="flex items-center justify-between py-2.5 text-sm">
            <dt>{label}</dt>
            <dd>
              <kbd className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-xs">{keys}</kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
