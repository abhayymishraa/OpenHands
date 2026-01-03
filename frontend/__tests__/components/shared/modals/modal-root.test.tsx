import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "test-utils";
import { ModalRoot } from "#/components/shared/modals/modal-root";
import { useModalStore } from "#/stores/modal-store";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  Trans: ({
    values,
    components,
  }: {
    values: { title: string };
    components: { title: React.ReactElement };
  }) => React.cloneElement(components.title, {}, values.title),
}));

describe("ModalRoot", () => {
  beforeEach(() => {
    // Reset the store state before each test
    act(() => {
      useModalStore.getState().closeModal();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when no modal is active", () => {
    const { container } = renderWithProviders(<ModalRoot />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render confirm-delete modal when opened", () => {
    act(() => {
      useModalStore.getState().openModal("confirm-delete", {
        conversationId: "test-id",
        conversationTitle: "Test Conversation",
        onConfirm: vi.fn(),
      });
    });

    renderWithProviders(<ModalRoot />);

    expect(screen.getByText(/Test Conversation/)).toBeInTheDocument();
  });

  it("should render confirm-stop modal when opened", () => {
    act(() => {
      useModalStore.getState().openModal("confirm-stop", {
        onConfirm: vi.fn(),
      });
    });

    renderWithProviders(<ModalRoot />);

    // ConfirmStopModal should be visible
    expect(
      screen.getByRole("button", { name: /confirm/i }),
    ).toBeInTheDocument();
  });

  it("should call onConfirm and close modal when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirmMock = vi.fn();

    act(() => {
      useModalStore.getState().openModal("confirm-delete", {
        conversationId: "test-id",
        conversationTitle: "Test Conversation",
        onConfirm: onConfirmMock,
      });
    });

    renderWithProviders(<ModalRoot />);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    expect(onConfirmMock).toHaveBeenCalledOnce();
    expect(useModalStore.getState().activeModal).toBeNull();
  });

  it("should close modal without calling onConfirm when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirmMock = vi.fn();

    act(() => {
      useModalStore.getState().openModal("confirm-delete", {
        conversationId: "test-id",
        conversationTitle: "Test Conversation",
        onConfirm: onConfirmMock,
      });
    });

    renderWithProviders(<ModalRoot />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onConfirmMock).not.toHaveBeenCalled();
    expect(useModalStore.getState().activeModal).toBeNull();
  });

  it("should replace modal when a new modal is opened", () => {
    act(() => {
      useModalStore.getState().openModal("confirm-delete", {
        conversationId: "test-id",
        conversationTitle: "First Modal",
        onConfirm: vi.fn(),
      });
    });

    const { rerender } = renderWithProviders(<ModalRoot />);

    expect(screen.getByText(/First Modal/)).toBeInTheDocument();

    act(() => {
      useModalStore.getState().openModal("confirm-stop", {
        onConfirm: vi.fn(),
      });
    });

    rerender(<ModalRoot />);

    expect(screen.queryByText(/First Modal/)).not.toBeInTheDocument();
  });
});
