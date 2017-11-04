import { WebView } from "tns-core-modules/ui/web-view";

export class WebViewUtils extends android.webkit.WebViewClient {
  // Note that using a static property limits usage of multiple webviews on one page with different headers,
  // but I don't think that is ever a real usecase for anyone.
  private static headers: Map<string, string>;
  private headersAddedTo: Set<string> = new Set<string>();

  private _view: any;
  private _origClient: any; // WebViewClient

  public static addHeaders(wv: WebView, headers: Map<string, string>) {
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
    if (this._view && url.indexOf("http") === 0 && !this.headersAddedTo.has(url)) {
      this._view.android.loadUrl(url, this.getAdditionalHeadersForUrl(url));
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
