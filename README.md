# NativeScript Directions plugin

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]:https://travis-ci.org/EddyVerbruggen/nativescript-webview-utils.svg?branch=master
[build-url]:https://travis-ci.org/EddyVerbruggen/nativescript-webview-utils
[npm-image]:http://img.shields.io/npm/v/nativescript-webview-utils.svg
[npm-url]:https://npmjs.org/package/nativescript-webview-utils
[downloads-image]:http://img.shields.io/npm/dm/nativescript-webview-utils.svg
[twitter-image]:https://img.shields.io/twitter/follow/eddyverbruggen.svg?style=social&label=Follow%20me
[twitter-url]:https://twitter.com/eddyverbruggen

## Installation
From the command prompt go to your app's root folder and execute:

```
tns plugin add nativescript-webview-utils
```

## Usage

### Demo app (XML + TypeScript)
You can run the demo app from the root of the project by typing `npm run demo.ios` or `npm run demo.android`.

<img src="https://raw.githubusercontent.com/EddyVerbruggen/nativescript-webview-utils/master/media/ios-headers.png" width="375px" height="690px"/>

## API

### `addHeaders`
If you're loading a page that requires you to send additional headers (for security perhaps),
this plugin allows you to dynamically inject those to any links within the webview.

```xml
<!-- assuming you have this WebView in your XML file -->
<WebView id="webviewWithCustomHeaders" loaded="webViewLoaded" height="360" src="https://httpbin.org/headers"/>
```

```typescript
// then add a few headers in the associated JS / TS file like this:
import { WebViewUtils } from 'nativescript-webview-utils';
import { WebView } from 'tns-core-modules/ui/web-view';
import * as observable from 'tns-core-modules/data/observable';

export function webViewLoaded(args: observable.EventData) {
  const wv: WebView = <WebView>args.object;
  const headers: Map<string, string> = new Map();
  headers.set("Foo", "Bar :P");
  headers.set("X-Custom-Header", "Set at " + new Date().toTimeString());
  WebViewUtils.addHeaders(wv, headers);
}
```

## Future work
* Ideas are welcome, just open an issue or PR :)