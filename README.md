# NativeScript WebView Utils plugin
Add request headers to a NativeScript WebView. Perhaps more utils later.

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

> Version 1.2.0 supports NativeScript-iOS 3.4 🎉 which switched from `UIWebView` to `WKWebView`. It's also backward compatible with older versions. You're welcome.

<img src="https://raw.githubusercontent.com/EddyVerbruggen/nativescript-webview-utils/master/media/ios-headers.png" width="300px"/>

## Installation
From the command prompt go to your app's root folder and execute:

```
tns plugin add nativescript-webview-utils
```

## Usage

### Demo app (XML + TypeScript)
You can run [the demo app](https://github.com/EddyVerbruggen/nativescript-webview-utils/tree/master/demo) from the root of the project by typing `npm run demo.ios` or `npm run demo.android`.

## API

### `addHeaders`
If you're loading a page that requires you to send additional headers (for security perhaps),
this function allows you to dynamically inject those to any links within the webview.

#### NativeScript with Angular

```html
<WebView [src]="someSource" (loaded)="webViewLoaded($event)"></WebView>
```

```typescript
import { EventData } from "tns-core-modules/data/observable";
import { WebView } from "tns-core-modules/ui/web-view";
import { WebViewUtils } from "nativescript-webview-utils";

export class MyComponent {
  someSource: string = "https://httpbin.org/headers";

  webViewLoaded(args: EventData): any {
    const webView: WebView = <WebView>args.object;
    const headers: Map<string, string> = new Map();
    headers.set("Foo", "Bar :P");
    headers.set("X-Custom-Header", "Set at " + new Date().toTimeString());
    WebViewUtils.addHeaders(webView, headers);
  }
}
```

#### NativeScript with XML

```xml
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

### `setUserAgent`
You can set this as a header, but it seems to work better setting it in a different way,
so use this function if you want to override the user agent in your webview.

> Note for NativeScript-iOS versions older than 3.4: this will override the user agent header in *all* of your webviews within your app. This is usually not an issue, but if it is: upgrade to `tns-ios` 3.4 or newer.

```typescript
import { WebViewUtils } from 'nativescript-webview-utils';
import { WebView } from 'tns-core-modules/ui/web-view';
import * as observable from 'tns-core-modules/data/observable';

export function webViewForUserAgentLoaded(args: observable.EventData) {
  const wv: WebView = <WebView>args.object;
  WebViewUtils.setUserAgent(wv, "My Super Duper User-Agent!");
}
```

## Credits
Quite some code was borrowed from [this repo](https://github.com/okmttdhr/nativescript-webview-custom-header).
