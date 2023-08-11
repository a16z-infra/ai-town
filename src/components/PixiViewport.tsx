'use client';

// Based on https://codepen.io/inlet/pen/yLVmPWv.
// Copyright (c) 2018 Patrick Brouwer, distributed under the MIT license.

import { Props } from '@headlessui/react/dist/types';
import { PixiComponent, useApp } from '@pixi/react';
import { Viewport } from 'pixi-viewport';

const PixiViewportComponent = PixiComponent('Viewport', {
  create(props) {
    const { app, ...viewportProps } = props;

    const viewport = new Viewport({
      events: app.renderer.events,
      passiveWheel: false,
      ...viewportProps,
    });

    // Activate plugins
    viewport
      .drag()
      .pinch({})
      .wheel()
      .decelerate()
      .clamp({ direction: 'all', underflow: 'center' })
      .clampZoom({
        minWidth: 50,
        maxWidth: 550,
      });

    return viewport;
  },
  applyProps(viewport, _oldProps, _newProps) {
    const { children: oldChildren, ...oldProps } = _oldProps;
    const { children: newChildren, ...newProps } = _newProps;

    Object.keys(newProps).forEach((p) => {
      if (oldProps[p] !== newProps[p]) {
        // @ts-expect-error
        viewport[p] = newProps[p];
      }
    });
  },
  didMount() {},
});

export default function PixiViewport(props: Props<typeof PixiViewportComponent>) {
  const app = useApp();
  return <PixiViewportComponent app={app} {...props} />;
}
