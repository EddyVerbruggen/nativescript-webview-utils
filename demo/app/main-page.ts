import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import { HelloWorldModel } from './main-view-model';
import { WebView } from 'tns-core-modules/ui/web-view';
import { WebViewUtils } from 'nativescript-webview-utils';

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
  // Get the event sender
  let page = <pages.Page>args.object;
  page.bindingContext = new HelloWorldModel();
}

export function webViewLoaded(args: observable.EventData) {
  const wv: WebView = <WebView>args.object;

  // as a bonus, hide those ugly Android zoomcontrols
  if (wv.android) {
    wv.android.getSettings().setBuiltInZoomControls(false);
  }

  const headers: Map<string, string> = new Map();
  headers.set("Foo", "Bar :P");
  headers.set("X-Custom-Header", "Set at " + new Date().toTimeString());
  WebViewUtils.addHeaders(wv, headers);
}

export function webViewForUserAgentLoaded(args: observable.EventData) {
  const wv: WebView = <WebView>args.object;
  WebViewUtils.setUserAgent(wv, "My Super Duper User-Agent!");
}
