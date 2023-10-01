export type Frame = {
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  rotated?: boolean;
  trimmed?: boolean;
  spriteSourceSize: {
    x: number;
    y: number;
  };
  sourceSize: {
    w: number;
    h: number;
  };
};

export type SpritesheetData = {
  frames: Record<string, Frame>;
  animations?: Record<string, string[]>;
  meta: {
    scale: string;
  };
};
