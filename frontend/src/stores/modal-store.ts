import { create } from "zustand";
import { Settings } from "#/types/settings";

export type ModalConfig =
  | {
      type: "confirm-delete";
      props: {
        conversationId: string;
        conversationTitle?: string;
        onConfirm: () => void;
      };
    }
  | {
      type: "confirm-stop";
      props: {
        onConfirm: () => void;
      };
    }
  | {
      type: "exit-conversation";
      props: {
        onConfirm: () => void;
      };
    }
  | {
      type: "settings";
      props: {
        settings?: Settings;
      };
    }
  | {
      type: "feedback";
      props: {
        polarity: "positive" | "negative";
      };
    };

export type ModalType = ModalConfig["type"];

interface ModalState {
  activeModal: ModalConfig | null;
}

interface ModalActions {
  openModal: <T extends ModalType>(
    type: T,
    props: Extract<ModalConfig, { type: T }>["props"],
  ) => void;
  closeModal: () => void;
}

type ModalStore = ModalState & ModalActions;

const initialState: ModalState = {
  activeModal: null,
};

export const useModalStore = create<ModalStore>((set) => ({
  ...initialState,

  openModal: (type, props) =>
    set({
      activeModal: { type, props } as ModalConfig,
    }),

  closeModal: () => set({ activeModal: null }),
}));
