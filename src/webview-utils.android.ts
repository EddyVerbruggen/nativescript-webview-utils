import { WebView } from "tns-core-modules/ui/web-view";
import { onLoadStarted, onLoadFinished } from "./webview-utils-common";

export class WebViewUtils extends android.webkit.WebViewClient {
  // Note that using a static property limits usage of multiple webviews on one page with different headers,
  // but I don't think that is ever a real usecase for anyone.
  private static headers: Map<string, string>;
  private static wv: WebView;
  private headersAddedTo: Set<string> = new Set<string>();

  // hackilish flag to make sure we don't fire the onLoadFinished event twice
  private isFirstLoad = true;

  private _view: any;
  private _origClient: any; // WebViewClient

  public static setUserAgent(wv: WebView, userAgent: string) {
    wv.android.getSettings().setUserAgentString(userAgent);
  }

  public static addHeaders(wv: WebView, headers: Map<string, string>) {
    WebViewUtils.wv = wv;
    WebViewUtils.headers = headers;
    // Wrap this in a timeout for Android, otherwise webview.android might not be initialized
    setTimeout(() => {
      (<any>wv).android.setWebViewClient(WebViewUtils.initWithView(wv));
    });
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

  // Note that this method is overloaded in Java (changed in Lollipop)
  public shouldOverrideUrlLoading(view: android.webkit.WebView, urlOrWebResourceRequest: any /* string | android.webkit.WebResourceRequest */): boolean {
    const url = typeof urlOrWebResourceRequest === "string" ? urlOrWebResourceRequest : urlOrWebResourceRequest.getUrl().toString();
    (<any>view).loadUrl(url, this.getAdditionalHeadersForUrl(url));
    return true;
  }

  public onPageStarted(view: android.webkit.WebView, url: string, favicon: android.graphics.Bitmap): void {
    super.onPageStarted(view, url, favicon);
    const headersAdded = this.headersAddedTo.has(url);
    if (this._view && url.indexOf("http") === 0 && !headersAdded) {
      this._view.android.loadUrl(url, this.getAdditionalHeadersForUrl(url));
    }
    if (headersAdded && WebViewUtils.wv) {
      onLoadStarted(WebViewUtils.wv, url, undefined);
    }
  }

  public onPageFinished(view: android.webkit.WebView, url: string) {
    super.onPageFinished(view, url);
    if (!this.isFirstLoad && WebViewUtils.wv) {
      onLoadFinished(WebViewUtils.wv, url, undefined);
      this.isFirstLoad = true;
    } else {
      this.isFirstLoad = false;
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
      });
      this.headersAddedTo.add(url);
    }
    return headers;
  }
}
