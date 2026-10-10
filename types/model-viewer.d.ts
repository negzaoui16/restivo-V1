import React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          poster?: string;
          alt?: string;
          "auto-rotate"?: boolean | string;
          "camera-controls"?: boolean | string;
          "touch-action"?: string;
          "shadow-intensity"?: string | number;
          ar?: boolean | string;
          "ar-modes"?: string;
          slot?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}
