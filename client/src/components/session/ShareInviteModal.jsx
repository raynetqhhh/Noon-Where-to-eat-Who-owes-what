import { Copy, MessageCircle, Share2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { copyText, sessionUrl, shareOrCopy, whatsappUrl } from '../../utils/share.js';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';

export default function ShareInviteModal({ open, onClose, session }) {
  const { toast } = useToast();
  const url = sessionUrl(session.code);
  const message = `🍽️ ${session.title}: help pick where we eat! Vote here (no app needed): ${url}`;

  return (
    <Modal open={open} onClose={onClose} title="Invite your group">
      <div className="rounded-2xl bg-surface-2 p-5 text-center">
        <p className="text-xs uppercase tracking-wide text-muted">Lunch code</p>
        <p className="mt-1 font-display text-4xl font-extrabold tracking-[0.25em]">{session.code}</p>
        <p className="mt-2 break-all text-xs text-muted">{url}</p>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Button href={whatsappUrl(message)} className="!bg-[#1f8f4e] !text-white">
          <MessageCircle size={16} /> WhatsApp
        </Button>
        <Button
          variant="secondary"
          onClick={async () => toast((await copyText(url)) ? 'Link copied' : 'Could not copy, select the link above')}
        >
          <Copy size={16} /> Copy link
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const result = await shareOrCopy({ title: session.title, text: message });
            if (result === 'copied') toast('Invite copied');
          }}
        >
          <Share2 size={16} /> More…
        </Button>
      </div>
    </Modal>
  );
}
