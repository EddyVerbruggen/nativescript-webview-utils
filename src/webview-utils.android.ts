import { WebView } from "tns-core-modules/ui/web-view";
import { onLoadFinished, onLoadStarted } from "./webview-utils-common";

export class WebViewUtils extends android.webkit.WebViewClient {
  // Note that using a static property limits usage of multiple webviews on one page with different headers,
  // but I don't think that is ever a real usecase for anyone.
  private static headers: Map<string, string>;
  private static wv: WebView;
  private headersAddedTo: Set<string> = new Set<string>();

  // hackilish flag to make sure we don't fire the onLoadFinished event multiple times
  private startEventCount = 0;

  private _view: any;
  private _origClient: any; // WebViewClient

  public static addHeaders(wv: WebView, headers: Map<string, string>) {
    WebViewUtils.wv = wv;
    WebViewUtils.headers = headers;
    // Conditionally wrap this in a timeout for Android, otherwise webview.android might not be initialized
    if ((<any>wv).android) {
      (<any>wv).android.setWebViewClient(WebViewUtils.initWithView(wv));
    } else {
      setTimeout(() => {
        (<any>wv).android.setWebViewClient(WebViewUtils.initWithView(wv));
      });
    }
  }

  private static initWithView(view: WebView): WebViewUtils {
    const client = new WebViewUtils();
    client._view = view;
    client._origClient = (<any>view)._webViewClient; // getWebViewClient = API level 26 (Android 8)
    return client;
  }

  constructor() {
    super();
    return global.__native(this);
  }

  // Note that this method is overloaded in Java (changed in Lollipop - no longer used, from the looks of it)
  public shouldOverrideUrlLoading(webView: android.webkit.WebView, urlOrWebResourceRequest: any /* string | android.webkit.WebResourceRequest */): boolean {
    const url = typeof urlOrWebResourceRequest === "string" ? urlOrWebResourceRequest : urlOrWebResourceRequest.getUrl().toString();
    (<any>webView).loadUrl(url, this.getAdditionalHeadersForUrl(url));
    return true;
  }

  public onPageStarted(webView: any, url: string, favicon: android.graphics.Bitmap): void {
    super.onPageStarted(webView, url, favicon);
    const headersAdded = this.headersAddedTo.has(url);
    const isHttpRequest = url.indexOf("http") === 0;
    if (isHttpRequest && !headersAdded) {
      ++this.startEventCount;
      this._view.android.loadUrl(url, this.getAdditionalHeadersForUrl(url));
      if (WebViewUtils.wv) {
        onLoadStarted(WebViewUtils.wv, url, undefined);
      }
    } else if (!isHttpRequest || (headersAdded && WebViewUtils.wv)) {
      if (!isHttpRequest || ++this.startEventCount === 1) {
        onLoadStarted(WebViewUtils.wv, url, undefined);
      }
    }
  }

  public onPageFinished(view: android.webkit.WebView, url: string) {
    super.onPageFinished(view, url);
    const isHttpRequest = url.indexOf("http") === 0;
    if (!isHttpRequest || (WebViewUtils.wv && this.startEventCount > 1)) {
      onLoadFinished(WebViewUtils.wv, url, undefined);
    }
  }

  public onReceivedError() {
    let view: android.webkit.WebView = arguments[0];

    if (arguments.length === 4) {
      let errorCode: number = arguments[1];
      let description: string = arguments[2];
      let failingUrl: string = arguments[3];
      super.onReceivedError(view, errorCode, description, failingUrl);

      if (WebViewUtils.wv) {
        onLoadFinished(WebViewUtils.wv, failingUrl, description + "(" + errorCode + ")");
      }
    } else {
      let request: any = arguments[1];
      let error: any = arguments[2];

      super.onReceivedError(view, request, error);

      const headersAdded = error.getUrl && this.headersAddedTo.has(error.getUrl());
      if (headersAdded && WebViewUtils.wv) {
        onLoadFinished(WebViewUtils.wv, error.getUrl && error.getUrl(), error.getDescription() + "(" + error.getErrorCode() + ")");
      }
    }
  }

  private getAdditionalHeadersForUrl(url: string): java.util.Map<String, String> {
    const headers: java.util.Map<String, String> = new java.util.HashMap();
    if (!this.headersAddedTo.has(url)) {
      WebViewUtils.headers.forEach((val, key) => {
        headers.put(key, val);
        if (key.toLowerCase() === "user-agent") {
          this._view.android.getSettings().setUserAgentString(val);
        }
      });
      this.headersAddedTo.add(url);
    }
    return headers;
  }
}
