import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useModalStore } from "#/stores/modal-store";

describe("useModalStore", () => {
  beforeEach(() => {
    // Reset the store state before each test
    act(() => {
      useModalStore.getState().closeModal();
    });
  });

  it("should have null activeModal initially", () => {
    const { result } = renderHook(() => useModalStore());
    expect(result.current.activeModal).toBeNull();
  });

  it("should open a confirm-delete modal with correct props", () => {
    const { result } = renderHook(() => useModalStore());
    const onConfirmMock = vi.fn();

    act(() => {
      result.current.openModal("confirm-delete", {
        conversationId: "test-id",
        conversationTitle: "Test Conversation",
        onConfirm: onConfirmMock,
      });
    });

    expect(result.current.activeModal).toEqual({
      type: "confirm-delete",
      props: {
        conversationId: "test-id",
        conversationTitle: "Test Conversation",
        onConfirm: onConfirmMock,
      },
    });
  });

  it("should open a confirm-stop modal with correct props", () => {
    const { result } = renderHook(() => useModalStore());
    const onConfirmMock = vi.fn();

    act(() => {
      result.current.openModal("confirm-stop", {
        onConfirm: onConfirmMock,
      });
    });

    expect(result.current.activeModal).toEqual({
      type: "confirm-stop",
      props: {
        onConfirm: onConfirmMock,
      },
    });
  });

  it("should open an exit-conversation modal with correct props", () => {
    const { result } = renderHook(() => useModalStore());
    const onConfirmMock = vi.fn();

    act(() => {
      result.current.openModal("exit-conversation", {
        onConfirm: onConfirmMock,
      });
    });

    expect(result.current.activeModal).toEqual({
      type: "exit-conversation",
      props: {
        onConfirm: onConfirmMock,
      },
    });
  });

  it("should open a settings modal with correct props", () => {
    const { result } = renderHook(() => useModalStore());

    act(() => {
      result.current.openModal("settings", {
        settings: undefined,
      });
    });

    expect(result.current.activeModal).toEqual({
      type: "settings",
      props: {
        settings: undefined,
      },
    });
  });

  it("should open a feedback modal with correct props", () => {
    const { result } = renderHook(() => useModalStore());

    act(() => {
      result.current.openModal("feedback", {
        polarity: "positive",
      });
    });

    expect(result.current.activeModal).toEqual({
      type: "feedback",
      props: {
        polarity: "positive",
      },
    });
  });

  it("should close the modal and set activeModal to null", () => {
    const { result } = renderHook(() => useModalStore());
    const onConfirmMock = vi.fn();

    act(() => {
      result.current.openModal("confirm-delete", {
        conversationId: "test-id",
        onConfirm: onConfirmMock,
      });
    });

    expect(result.current.activeModal).not.toBeNull();

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBeNull();
  });

  it("should replace existing modal when opening a new one", () => {
    const { result } = renderHook(() => useModalStore());
    const onConfirmMock1 = vi.fn();
    const onConfirmMock2 = vi.fn();

    act(() => {
      result.current.openModal("confirm-delete", {
        conversationId: "test-id-1",
        onConfirm: onConfirmMock1,
      });
    });

    expect(result.current.activeModal?.type).toBe("confirm-delete");

    act(() => {
      result.current.openModal("confirm-stop", {
        onConfirm: onConfirmMock2,
      });
    });

    expect(result.current.activeModal?.type).toBe("confirm-stop");
    expect(result.current.activeModal).toEqual({
      type: "confirm-stop",
      props: {
        onConfirm: onConfirmMock2,
      },
    });
  });
});
