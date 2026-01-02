import { useModalStore } from "#/stores/modal-store";
import { ConfirmDeleteModal } from "#/components/features/conversation-panel/confirm-delete-modal";
import { ConfirmStopModal } from "#/components/features/conversation-panel/confirm-stop-modal";
import { ExitConversationModal } from "#/components/features/conversation-panel/exit-conversation-modal";
import { SettingsModal } from "#/components/shared/modals/settings/settings-modal";
import { FeedbackModal } from "#/components/features/feedback/feedback-modal";

export function ModalRoot() {
  const { activeModal, closeModal } = useModalStore();

  if (!activeModal) {
    return null;
  }

  const { type, props } = activeModal;

  switch (type) {
    case "confirm-delete":
      return (
        <ConfirmDeleteModal
          conversationTitle={props.conversationTitle}
          onConfirm={() => {
            props.onConfirm();
            closeModal();
          }}
          onCancel={closeModal}
        />
      );
    case "confirm-stop":
      return (
        <ConfirmStopModal
          onConfirm={() => {
            props.onConfirm();
            closeModal();
          }}
          onCancel={closeModal}
        />
      );
    case "exit-conversation":
      return (
        <ExitConversationModal
          onConfirm={() => {
            props.onConfirm();
            closeModal();
          }}
          onClose={closeModal}
          onCancel={closeModal}
        />
      );
    case "settings":
      return <SettingsModal settings={props.settings} onClose={closeModal} />;
    case "feedback":
      return (
        <FeedbackModal isOpen polarity={props.polarity} onClose={closeModal} />
      );
    default:
      return null;
  }
}
