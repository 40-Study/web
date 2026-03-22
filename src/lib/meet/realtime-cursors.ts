/**
 * Realtime Multi-User Cursor System (Figma-like)
 *
 * - Throttle 50ms + delta >2px
 * - Lerp interpolation
 * - Name visible while moving, hide after 2s
 * - Hover to show name
 * - requestAnimationFrame rendering
 * - Max 50 cursors, auto cleanup after 5s
 */

// ========== TYPES ==========
export interface CursorData {
  x: number;  // world coordinates
  y: number;  // world coordinates
  id: string;
  n: string;  // name
  c: string;  // color
}

export interface ViewportState {
  zoom: number;
  scrollX: number;
  scrollY: number;
}

interface CursorState {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  name: string;
  color: string;
  element: HTMLElement;
  lastUpdate: number;
  hideTimeout: number | null;
}

// ========== CONFIG ==========
const THROTTLE_MS = 50;
const DELTA_PX = 2;
const LERP = 0.15;
const NAME_HIDE_MS = 2000;
const CURSOR_TIMEOUT_MS = 5000;
const CLEANUP_MS = 1000;
const MAX_CURSORS = 50;

// ========== COLOR FROM USER ID ==========
export function hashColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#74B9FF', '#A29BFE', '#FD79A8', '#00B894', '#E17055',
    '#6C5CE7', '#FDCB6E', '#E84393', '#00CEC9', '#2ED573',
  ];
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = userId.charCodeAt(i) + ((h << 5) - h);
  }
  return colors[Math.abs(h) % colors.length];
}

// ========== CURSOR MANAGER ==========
export class CursorManager {
  private cursors = new Map<string, CursorState>();
  private container: HTMLElement | null = null;
  private rafId = 0;
  private cleanupId = 0;

  private myId = '';
  private myName = '';
  private myColor = '';
  private lastX = 0;
  private lastY = 0;
  private lastSendTime = 0;

  // Viewport state for coordinate transformation
  private viewport: ViewportState = { zoom: 1, scrollX: 0, scrollY: 0 };

  private sendFn: ((data: CursorData) => void) | null = null;

  // Update viewport (call this when zoom/pan changes)
  updateViewport(state: ViewportState) {
    this.viewport = state;
  }

  // ===== INIT =====
  init(opts: {
    container: HTMLElement;
    userId: string;
    userName: string;
    onSend: (data: CursorData) => void;
  }) {
    this.container = opts.container;
    this.myId = opts.userId;
    this.myName = opts.userName;
    this.myColor = hashColor(opts.userId);
    this.sendFn = opts.onSend;

    this.injectCSS();
    this.startLoop();
    this.cleanupId = window.setInterval(() => this.cleanup(), CLEANUP_MS);

    this.container.addEventListener('mousemove', this.onMove);
    this.container.addEventListener('mouseleave', this.onLeave);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.cleanupId) clearInterval(this.cleanupId);
    this.container?.removeEventListener('mousemove', this.onMove);
    this.container?.removeEventListener('mouseleave', this.onLeave);
    this.cursors.forEach(s => s.element.remove());
    this.cursors.clear();
  }

  // ===== CSS =====
  private injectCSS() {
    if (document.getElementById('cursor-styles')) return;
    const style = document.createElement('style');
    style.id = 'cursor-styles';
    style.textContent = `
      .cursor-remote {
        position: absolute;
        top: 0; left: 0;
        pointer-events: none;
        z-index: 9999;
        will-change: transform;
      }
      .cursor-remote svg {
        width: 20px; height: 20px;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
      }
      .cursor-label {
        position: absolute;
        left: 14px; top: 16px;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        color: #fff;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: auto;
      }
      .cursor-label.show { opacity: 1; }
      .cursor-remote:hover .cursor-label { opacity: 1 !important; }
    `;
    document.head.appendChild(style);
  }

  // ===== COORDINATE CONVERSION (Excalidraw formula) =====
  // Screen to World: for sending cursor position
  // Formula: worldX = screenX / zoom - scrollX
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const { zoom, scrollX, scrollY } = this.viewport;
    return {
      x: screenX / zoom - scrollX,
      y: screenY / zoom - scrollY,
    };
  }

  // World to Screen: for displaying remote cursors
  // Formula: screenX = (worldX + scrollX) * zoom
  private worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const { zoom, scrollX, scrollY } = this.viewport;
    return {
      x: (worldX + scrollX) * zoom,
      y: (worldY + scrollY) * zoom,
    };
  }

  // ===== SEND =====
  private onMove = (e: MouseEvent) => {
    const now = performance.now();
    if (now - this.lastSendTime < THROTTLE_MS) return;

    const rect = this.container!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert to world coordinates
    const world = this.screenToWorld(screenX, screenY);

    if (Math.abs(world.x - this.lastX) < DELTA_PX && Math.abs(world.y - this.lastY) < DELTA_PX) return;

    this.lastX = world.x;
    this.lastY = world.y;
    this.lastSendTime = now;

    this.sendFn?.({
      x: Math.round(world.x),
      y: Math.round(world.y),
      id: this.myId,
      n: this.myName,
      c: this.myColor,
    });
  };

  private onLeave = () => {
    this.sendFn?.({
      x: -100,
      y: -100,
      id: this.myId,
      n: this.myName,
      c: this.myColor,
    });
  };

  // ===== RECEIVE =====
  receive(data: CursorData) {
    if (data.id === this.myId) return;

    let state = this.cursors.get(data.id);

    if (!state) {
      if (this.cursors.size >= MAX_CURSORS) this.removeOldest();

      const el = document.createElement('div');
      el.className = 'cursor-remote';
      el.innerHTML = `
        <svg viewBox="0 0 24 24" fill="${data.c}">
          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36z"/>
        </svg>
        <span class="cursor-label show" style="background:${data.c}">${data.n}</span>
      `;
      this.container?.appendChild(el);

      state = {
        currentX: data.x,
        currentY: data.y,
        targetX: data.x,
        targetY: data.y,
        name: data.n,
        color: data.c,
        element: el,
        lastUpdate: performance.now(),
        hideTimeout: null,
      };
      this.cursors.set(data.id, state);
    }

    state.targetX = data.x;
    state.targetY = data.y;
    state.lastUpdate = performance.now();

    // Show name, hide after delay
    const label = state.element.querySelector('.cursor-label') as HTMLElement;
    if (label) {
      label.classList.add('show');
      if (state.hideTimeout) clearTimeout(state.hideTimeout);
      state.hideTimeout = window.setTimeout(() => {
        label.classList.remove('show');
      }, NAME_HIDE_MS);
    }
  }

  // ===== RENDER LOOP =====
  private startLoop() {
    const render = () => {
      this.cursors.forEach(s => {
        // Interpolate in world coordinates
        s.currentX += (s.targetX - s.currentX) * LERP;
        s.currentY += (s.targetY - s.currentY) * LERP;
        // Convert to screen coordinates for display
        const screen = this.worldToScreen(s.currentX, s.currentY);
        s.element.style.transform = `translate3d(${screen.x}px,${screen.y}px,0)`;
      });
      this.rafId = requestAnimationFrame(render);
    };
    this.rafId = requestAnimationFrame(render);
  }

  // ===== CLEANUP =====
  private cleanup() {
    const now = performance.now();
    this.cursors.forEach((s, id) => {
      if (now - s.lastUpdate > CURSOR_TIMEOUT_MS) {
        if (s.hideTimeout) clearTimeout(s.hideTimeout);
        s.element.remove();
        this.cursors.delete(id);
      }
    });
  }

  private removeOldest() {
    let oldestId: string | null = null;
    let oldestTime = Infinity;
    this.cursors.forEach((s, id) => {
      if (s.lastUpdate < oldestTime) {
        oldestTime = s.lastUpdate;
        oldestId = id;
      }
    });
    if (oldestId) {
      const s = this.cursors.get(oldestId);
      if (s) {
        if (s.hideTimeout) clearTimeout(s.hideTimeout);
        s.element.remove();
      }
      this.cursors.delete(oldestId);
    }
  }

  removeCursor(userId: string) {
    const s = this.cursors.get(userId);
    if (s) {
      if (s.hideTimeout) clearTimeout(s.hideTimeout);
      s.element.remove();
      this.cursors.delete(userId);
    }
  }
}

// ===== SINGLETON =====
export const cursorManager = new CursorManager();
