import { useEffect, useRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn(),
  elements: [] as readonly unknown[],
  change: null as null | ((elements: readonly unknown[], appState: object) => void),
}));
vi.mock("@/lib/meet/api", () => ({ api: { get: state.get, post: state.post }, MeetApiError: class extends Error {} }));
const editor = {
  getSceneElements: () => state.elements,
  updateScene: ({ elements }: { elements: readonly unknown[] }) => {
    state.elements = elements;
    state.change?.(elements, {});
  },
};
vi.mock("next/dynamic", () => ({ default: () => function MockDrawing(props: {
  excalidrawAPI: (api: typeof editor) => void;
  onChange: (elements: readonly unknown[], appState: object) => void;
  viewModeEnabled: boolean;
}) {
  const mount = useRef(props.excalidrawAPI);
  state.change = props.onChange;
  useEffect(() => { mount.current(editor); state.change?.([], {}); }, []);
  return <button disabled={props.viewModeEnabled} onClick={() => {
    state.elements = [{ id: "stroke", version: 2 }];
    state.change?.(state.elements, {});
  }}>Vẽ thử</button>;
} }));
import WhiteboardTab from "./WhiteboardTab";
const props = { sessionId: "room-1", isHost: true, onClose: () => {} };
async function settle() { await act(async () => { await vi.advanceTimersByTimeAsync(400); }); }

describe("whiteboard saves only drawing changes", () => {
  beforeEach(() => {
    vi.useFakeTimers(); state.elements = []; state.change = null;
    state.get.mockReset().mockResolvedValue({ data: { elements: [{ id: "saved", version: 1 }] } });
    state.post.mockReset().mockResolvedValue({});
  });
  afterEach(() => vi.useRealTimers());
  it("loading the saved scene and changing viewport do not save an empty or duplicate snapshot", async () => {
    render(<WhiteboardTab {...props} />); await settle();
    expect(state.get).toHaveBeenCalledTimes(1);
    expect(state.elements).toEqual([{ id: "saved", version: 1 }]);
    act(() => state.change?.(state.elements, { zoom: { value: 2 } })); await settle();
    expect(state.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Vẽ thử" })); await settle();
    expect(state.post).toHaveBeenCalledTimes(1);
    expect(state.post).toHaveBeenCalledWith("/whiteboard/room-1/snapshot", { elements: [{ id: "stroke", version: 2 }] });
  });
  it("closing the board cancels a pending save", async () => {
    const view = render(<WhiteboardTab {...props} />); await settle();
    fireEvent.click(screen.getByRole("button", { name: "Vẽ thử" }));
    view.unmount(); await settle();
    expect(state.post).not.toHaveBeenCalled();
  });
  it("remote scene updates are applied without posting an echo", async () => {
    const view = render(<WhiteboardTab {...props} />); await settle();
    view.rerender(<WhiteboardTab {...props} remoteWhiteboardEvent={{ type: "whiteboard_event", action: "update", senderId: "other", payload: JSON.stringify([{ id: "remote", version: 3 }]) }} />);
    await settle();
    expect(state.elements).toContainEqual({ id: "remote", version: 3 });
    expect(state.post).not.toHaveBeenCalled();
  });
});
