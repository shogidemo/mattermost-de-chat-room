import { useState, useCallback, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DraggableState {
  position: Position;
  isDragging: boolean;
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    style: React.CSSProperties;
  };
  dialogProps: {
    style: React.CSSProperties;
  };
  resetPosition: () => void;
}

interface UseDraggableOptions {
  defaultPosition?: Position;
  bounds?: {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
  };
  storageKey?: string;
}

export const useDraggable = (options: UseDraggableOptions = {}): DraggableState => {
  const {
    defaultPosition = { x: window.innerWidth - 370, y: 100 }, // 右下からのデフォルト位置
    bounds,
    storageKey = 'draggable-panel-position'
  } = options;

  // localStorageから保存された位置を読み込み
  const getStoredPosition = (): Position => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // 画面サイズが変わった場合の調整
          return {
            x: Math.min(Math.max(parsed.x, 0), window.innerWidth - 350),
            y: Math.min(Math.max(parsed.y, 0), window.innerHeight - 500)
          };
        }
      } catch (error) {
        console.warn('ドラッグ位置の復元に失敗しました:', error);
      }
    }
    return defaultPosition;
  };

  const [position, setPosition] = useState<Position>(getStoredPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const elementStartRef = useRef<Position>({ x: 0, y: 0 });

  // 位置をlocalStorageに保存
  const savePosition = useCallback((newPosition: Position) => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newPosition));
      } catch (error) {
        console.warn('ドラッグ位置の保存に失敗しました:', error);
      }
    }
  }, [storageKey]);

  // 境界チェックを行う関数
  const constrainPosition = useCallback((pos: Position): Position => {
    const padding = 20; // 画面端からの最小距離
    const panelWidth = 350;
    const panelHeight = 500;

    let constrainedX = pos.x;
    let constrainedY = pos.y;

    // カスタム境界がある場合
    if (bounds) {
      if (bounds.left !== undefined) constrainedX = Math.max(constrainedX, bounds.left);
      if (bounds.right !== undefined) constrainedX = Math.min(constrainedX, bounds.right - panelWidth);
      if (bounds.top !== undefined) constrainedY = Math.max(constrainedY, bounds.top);
      if (bounds.bottom !== undefined) constrainedY = Math.min(constrainedY, bounds.bottom - panelHeight);
    } else {
      // デフォルト境界（画面サイズ）
      constrainedX = Math.max(padding, Math.min(constrainedX, window.innerWidth - panelWidth - padding));
      constrainedY = Math.max(padding, Math.min(constrainedY, window.innerHeight - panelHeight - padding));
    }

    return { x: constrainedX, y: constrainedY };
  }, [bounds]);

  // マウスダウン/タッチスタートのハンドラ
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    elementStartRef.current = { ...position };
    document.body.style.userSelect = 'none'; // テキスト選択を無効化
  }, [position]);

  // マウスムーブ/タッチムーブのハンドラ
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    const newPosition = constrainPosition({
      x: elementStartRef.current.x + deltaX,
      y: elementStartRef.current.y + deltaY
    });

    setPosition(newPosition);
  }, [isDragging, constrainPosition]);

  // ドラッグ終了のハンドラ
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = ''; // テキスト選択を再有効化
      savePosition(position);
    }
  }, [isDragging, position, savePosition]);

  // マウスイベントのリスナー
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // タッチイベントのリスナー
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        handleDragMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      handleDragEnd();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // ウィンドウリサイズ時の位置調整
  useEffect(() => {
    const handleResize = () => {
      setPosition(current => constrainPosition(current));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainPosition]);

  // 位置リセット関数
  const resetPosition = useCallback(() => {
    const newPosition = constrainPosition(defaultPosition);
    setPosition(newPosition);
    savePosition(newPosition);
  }, [constrainPosition, defaultPosition, savePosition]);

  return {
    position,
    isDragging,
    dragHandleProps: {
      onMouseDown: (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX, e.clientY);
      },
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
          handleDragStart(touch.clientX, touch.clientY);
        }
      },
      style: {
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none' as const,
        touchAction: 'none'
      }
    },
    dialogProps: {
      style: {
        position: 'fixed' as const,
        left: position.x,
        top: position.y,
        right: 'auto',
        bottom: 'auto',
        margin: 0,
        transform: 'none',
        opacity: isDragging ? 0.8 : 1,
        transition: isDragging ? 'none' : 'opacity 0.2s ease-in-out'
      }
    },
    resetPosition
  };
};

export default useDraggable;