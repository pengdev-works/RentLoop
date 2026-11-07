import Swal from 'sweetalert2';

/**
 * RentLoop Sleek Toast Notification
 */
const RLToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

/**
 * RentLoop Branded Modal Dialog
 */
const RLModal = Swal.mixin({
  customClass: {
    popup: 'rl-modal-popup',
    title: 'rl-modal-title',
    htmlContainer: 'rl-modal-html',
    confirmButton: 'rl-btn-confirm',
    cancelButton: 'rl-btn-cancel',
    icon: 'rl-modal-icon',
  },
  buttonsStyling: false,
});

/* ── Toast Helpers ────────────────────────────────────────── */
export const toast = (icon, title, timer = 3200) =>
  RLToast.fire({ icon, title, timer });

export const toastOk   = (title, timer) => RLToast.fire({ icon: 'success', title, timer });
export const toastErr  = (title, timer) => RLToast.fire({ icon: 'error',   title, timer });
export const toastInfo = (title, timer) => RLToast.fire({ icon: 'info',    title, timer });
export const toastWarn = (title, timer) => RLToast.fire({ icon: 'warning', title, timer });

/* ── Modal Dialog Helpers ─────────────────────────────────── */
export const alertSuccess = (title, text) =>
  RLModal.fire({ icon: 'success', title, text, confirmButtonText: 'Got it' });

export const alertError = (title, text) =>
  RLModal.fire({ icon: 'error', title, text, confirmButtonText: 'Close' });

export const alertWarning = (title, text) =>
  RLModal.fire({ icon: 'warning', title, text, confirmButtonText: 'OK' });

export const alert = (title, text, icon = 'info') =>
  RLModal.fire({ icon, title, text, confirmButtonText: 'OK' });

/** Confirmation dialog — returns true if user confirmed */
export const confirm = async (title, text, confirmText = 'Confirm', icon = 'question') => {
  const result = await RLModal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
  });
  return result.isConfirmed;
};

/** Destructive confirmation dialog (Red primary action) */
export const confirmDanger = async (title, text, confirmText = 'Yes, proceed') => {
  const result = await RLModal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'rl-modal-popup',
      title: 'rl-modal-title',
      htmlContainer: 'rl-modal-html',
      confirmButton: 'rl-btn-danger',
      cancelButton: 'rl-btn-cancel',
      icon: 'rl-modal-icon',
    },
  });
  return result.isConfirmed;
};

export default { RLToast, RLModal };
