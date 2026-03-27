type RegistrationClosedModalProps = {
  open: boolean;
  onClose: () => void;
};

const RegistrationClosedModal = ({ open, onClose }: RegistrationClosedModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-card/90 p-6 text-center shadow-xl">
        <h3 className="font-heading text-xl font-bold text-foreground mb-3">Registration Closed</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Registration closes 12 hours before the event. Please contact the coordinator for assistance.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold"
        >
          Okay
        </button>
      </div>
    </div>
  );
};

export default RegistrationClosedModal;
