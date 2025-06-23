import { renderHook, act } from '@testing-library/react';
import { useDraggable } from '../useDraggable';

// window.innerWidth/innerHeight のモック
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// addEventListener/removeEventListener のモック
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(document, 'addEventListener', {
  value: mockAddEventListener,
});

Object.defineProperty(document, 'removeEventListener', {
  value: mockRemoveEventListener,
});

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
});

// setTimeout/clearTimeout のモック
const mockSetTimeout = jest.fn((fn: Function, delay: number) => {
  fn();
  return 123;
});
const mockClearTimeout = jest.fn();

global.setTimeout = mockSetTimeout as any;
global.clearTimeout = mockClearTimeout as any;

describe('useDraggable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // document.body.style をモック
    Object.defineProperty(document.body, 'style', {
      value: {
        userSelect: '',
      },
      writable: true,
    });
  });

  describe('初期化', () => {
    it('デフォルト位置で初期化される', () => {
      const { result } = renderHook(() => useDraggable());
      
      expect(result.current.position.x).toBeGreaterThan(0);
      expect(result.current.position.y).toBeGreaterThan(0);
      expect(result.current.isDragging).toBe(false);
    });

    it('カスタムデフォルト位置で初期化される', () => {
      const defaultPosition = { x: 100, y: 200 };
      const { result } = renderHook(() => 
        useDraggable({ defaultPosition })
      );
      
      expect(result.current.position).toEqual(defaultPosition);
    });

    it('localStorage から位置を復元する', () => {
      const storedPosition = { x: 150, y: 250 };
      localStorage.setItem('test-storage', JSON.stringify(storedPosition));
      
      const { result } = renderHook(() => 
        useDraggable({ 
          storageKey: 'test-storage',
          defaultPosition: { x: 100, y: 200 }
        })
      );
      
      expect(result.current.position).toEqual(storedPosition);
    });
  });

  describe('ドラッグハンドル', () => {
    it('ドラッグハンドルプロパティが正しく設定される', () => {
      const { result } = renderHook(() => useDraggable());
      
      expect(result.current.dragHandleProps).toHaveProperty('onMouseDown');
      expect(result.current.dragHandleProps).toHaveProperty('onTouchStart');
      expect(result.current.dragHandleProps).toHaveProperty('style');
      expect(result.current.dragHandleProps.style.cursor).toBe('grab');
    });

    it('ドラッグ中はカーソルが変わる', () => {
      const { result } = renderHook(() => useDraggable());
      
      // マウスダウンイベントをシミュレート
      const mockMouseEvent = {
        preventDefault: jest.fn(),
        clientX: 100,
        clientY: 200,
      } as any;

      act(() => {
        result.current.dragHandleProps.onMouseDown(mockMouseEvent);
      });
      
      expect(result.current.isDragging).toBe(true);
      expect(result.current.dragHandleProps.style.cursor).toBe('grabbing');
    });
  });

  describe('位置制約', () => {
    it('画面境界内に位置が制約される', () => {
      // 画面外の位置でテスト
      localStorage.setItem('test-storage', JSON.stringify({ x: -100, y: -100 }));
      
      const { result } = renderHook(() => 
        useDraggable({ storageKey: 'test-storage' })
      );
      
      expect(result.current.position.x).toBeGreaterThanOrEqual(0);
      expect(result.current.position.y).toBeGreaterThanOrEqual(0);
    });

    it('カスタム境界で位置が制約される', () => {
      const bounds = { left: 50, top: 50, right: 500, bottom: 400 };
      
      const { result } = renderHook(() => 
        useDraggable({ 
          defaultPosition: { x: 10, y: 10 }, // 境界外の位置
          bounds 
        })
      );
      
      expect(result.current.position.x).toBeGreaterThanOrEqual(bounds.left);
      expect(result.current.position.y).toBeGreaterThanOrEqual(bounds.top);
    });
  });

  describe('リセット機能', () => {
    it('位置をデフォルトにリセットできる', () => {
      const defaultPosition = { x: 100, y: 200 };
      const { result } = renderHook(() => 
        useDraggable({ defaultPosition })
      );
      
      // 位置を変更
      act(() => {
        const mockMouseEvent = {
          preventDefault: jest.fn(),
          clientX: 300,
          clientY: 400,
        } as any;
        result.current.dragHandleProps.onMouseDown(mockMouseEvent);
      });
      
      // リセット実行
      act(() => {
        result.current.resetPosition();
      });
      
      expect(result.current.position).toEqual(defaultPosition);
    });

    it('リセット時にlocalStorageに保存される', () => {
      const defaultPosition = { x: 100, y: 200 };
      const storageKey = 'test-reset-storage';
      
      const { result } = renderHook(() => 
        useDraggable({ defaultPosition, storageKey })
      );
      
      act(() => {
        result.current.resetPosition();
      });
      
      const stored = localStorage.getItem(storageKey);
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(defaultPosition);
    });
  });

  describe('ダイアログプロパティ', () => {
    it('ダイアログスタイルが正しく設定される', () => {
      const position = { x: 150, y: 250 };
      const { result } = renderHook(() => 
        useDraggable({ defaultPosition: position })
      );
      
      const style = result.current.dialogProps.style;
      expect(style.position).toBe('fixed');
      expect(style.left).toBe(position.x);
      expect(style.top).toBe(position.y);
      expect(style.opacity).toBe(1);
    });

    it('ドラッグ中は透明度が変わる', () => {
      const { result } = renderHook(() => useDraggable());
      
      // ドラッグ開始
      act(() => {
        const mockMouseEvent = {
          preventDefault: jest.fn(),
          clientX: 100,
          clientY: 200,
        } as any;
        result.current.dragHandleProps.onMouseDown(mockMouseEvent);
      });
      
      expect(result.current.dialogProps.style.opacity).toBe(0.8);
    });
  });

  describe('エラーハンドリング', () => {
    it('localStorage エラーを適切に処理する', () => {
      // localStorage.getItem をエラーを投げるようにモック
      const mockGetItem = jest.fn(() => {
        throw new Error('localStorage error');
      });
      Storage.prototype.getItem = mockGetItem;
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { result } = renderHook(() => 
        useDraggable({ storageKey: 'test-error' })
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'ドラッグ位置の復元に失敗しました:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('不正なJSON データを適切に処理する', () => {
      localStorage.setItem('test-invalid', 'invalid json');
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { result } = renderHook(() => 
        useDraggable({ storageKey: 'test-invalid' })
      );
      
      expect(consoleSpy).toHaveBeenCalled();
      // デフォルト位置にフォールバックする
      expect(result.current.position).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });

  describe('イベントリスナー', () => {
    it('ドラッグ開始時にイベントリスナーが追加される', () => {
      const { result } = renderHook(() => useDraggable());
      
      act(() => {
        const mockMouseEvent = {
          preventDefault: jest.fn(),
          clientX: 100,
          clientY: 200,
        } as any;
        result.current.dragHandleProps.onMouseDown(mockMouseEvent);
      });
      
      expect(mockAddEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    });

    it('ウィンドウリサイズリスナーが追加される', () => {
      renderHook(() => useDraggable());
      
      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});