import React from 'react';

// Minimal typings for the Material Web custom elements used in this app.
// Props not listed fall through as attributes; complex props are set via refs.

type MdProps = React.HTMLAttributes<HTMLElement> & Record<string, unknown>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-switch': MdProps & { checked?: boolean };
      'md-checkbox': MdProps & { checked?: boolean };
      'md-filled-button': MdProps;
      'md-outlined-button': MdProps;
      'md-slider': MdProps & { min?: number; max?: number; value?: number; step?: number };
      'md-dialog': MdProps;
    }
  }
}

export {};
