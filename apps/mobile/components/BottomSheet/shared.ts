interface ButtonProps {
    label: string,
    icon: string,
    enabled: boolean,
    show: boolean,
}

interface ActionButtonsProps {
    closeButton: ButtonProps,
    doneButton: ButtonProps,
}

export interface ModalProps {
    title: string,
    allowClose: boolean,
    visible: boolean,
    showActionButtons: boolean,
    actionButtons: ActionButtonsProps,
}
  
  export const modalEmits = ['modalClose', 'modalDone', 'modalCancel'] as string[];
  