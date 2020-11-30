import { WebView } from "@nativescript/core";
import { WebViewUtils } from "nativescript-webview-utils";

describe("addHeaders", () => {
  it("exists", () => {
    expect(WebViewUtils.addHeaders).toBeDefined();
  });

  it("fires the loadStarted and loadFinished events once", done => {
    // init the counters to keep track of those events
    let loadStartedCounter = 0;
    let loadFinishedCounter = 0;

    // create a WebView and hook up the events
    const webView = new WebView();
    webView.on(WebView.loadStartedEvent, data => loadStartedCounter++);
    webView.on(WebView.loadFinishedEvent, data => loadFinishedCounter++);

    const headers: Map<string, string> = new Map();
    headers.set("User-Agent", "My Awesome User-Agent!");
    headers.set("Custom-Header", "Another header");

    WebViewUtils.addHeaders(webView, headers);

    // load a website
    (<any>webView)._loadUrl("https://httpbin.org/headers?testing=schmesting");

    setTimeout(() => {
      // if both events fired once, it's ok
      expect(loadStartedCounter).toBeGreaterThanOrEqual(1);
      expect(loadFinishedCounter).toBeGreaterThanOrEqual(1);
      done();
    }, 4000);
  });
});
