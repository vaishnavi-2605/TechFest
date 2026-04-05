import { createPortal } from "react-dom";

type PosterPreviewModalProps = {
  open: boolean;
  imageUrl?: string | null;
  title?: string;
  onClose: () => void;
};

const PosterPreviewModal = ({ open, imageUrl, title, onClose }: PosterPreviewModalProps) => {
  if (!open || typeof document === "undefined" || !imageUrl) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div
        className="relative inline-flex max-h-[85vh] max-w-[92vw] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-card/95 p-2 sm:p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-black/80 px-3 py-1 text-[11px] text-white shadow-lg hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Close poster preview"
        >
          Close
        </button>
        <div className="flex max-h-[80vh] w-full items-center justify-center">
          <img
            src={imageUrl}
            alt={title || "Event poster"}
            className="max-h-[80vh] max-w-[86vw] w-auto rounded-2xl object-contain"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PosterPreviewModal;
