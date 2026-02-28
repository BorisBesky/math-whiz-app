import { useState, useCallback, useRef } from 'react';

/**
 * Hook that manages confirmation modal state.
 *
 * Usage:
 *   const { confirmationProps, confirm } = useConfirmation();
 *
 *   const handleDelete = async () => {
 *     const ok = await confirm({
 *       title: 'Delete item',
 *       message: 'Are you sure?',
 *       variant: 'danger',
 *       confirmLabel: 'Delete',
 *     });
 *     if (!ok) return;
 *     // perform delete...
 *   };
 *
 *   return <><ConfirmationModal {...confirmationProps} /><button onClick={handleDelete}>Delete</button></>;
 */
const useConfirmation = () => {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    isLoading: false,
  });

  const resolveRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        title: options.title || 'Confirm',
        message: options.message || 'Are you sure?',
        variant: options.variant || 'danger',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        isLoading: false,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const confirmationProps = {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    variant: state.variant,
    confirmLabel: state.confirmLabel,
    cancelLabel: state.cancelLabel,
    isLoading: state.isLoading,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return { confirmationProps, confirm };
};

export default useConfirmation;
