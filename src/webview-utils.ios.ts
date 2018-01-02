import { WebView } from "tns-core-modules/ui/web-view";

export class WebViewUtils extends NSObject implements UIWebViewDelegate {
  public static ObjCProtocols = [UIWebViewDelegate];

  // Note that using a static property limits usage of multiple webviews on one page with different headers,
  // but I don't think that is ever a real usecase for anyone.
  private static headers: Map<string, string>;

  private _owner: WeakRef<WebView>;
  private _originalDelegate: any; // UIWebViewDelegateImpl

  public static setUserAgent(wv: WebView, userAgent: string) {
    // note that overrides the useragent for ALL webviews for the app, but that's prolly not a problem
    NSUserDefaults.standardUserDefaults.registerDefaults(
        NSDictionary.dictionaryWithObjectForKey(userAgent, "UserAgent"));
  }

  public static addHeaders(wv: WebView, headers: Map<string, string>) {
    (<any>wv)._delegate = WebViewUtils.initWithOwner(new WeakRef(wv));
    WebViewUtils.headers = headers;
  }

  private static initWithOwner(owner: WeakRef<WebView>): WebViewUtils {
    let delegate = new WebViewUtils();
    delegate._owner = owner;
    delegate._originalDelegate = (<any>owner.get())._delegate;
    return delegate;
  }

  // TODO this is prolly different for WKWebView
  // You can customize your http headers here.
  public webViewShouldStartLoadWithRequestNavigationType(webView: UIWebView, request: NSURLRequest, navigationType: number) {
    const urlString: string = request.URL.absoluteString;
    const isNavigationTypeBackForward = navigationType === UIWebViewNavigationType.BackForward;
    const isHttpRequest = urlString.indexOf("http") === 0;
    let areHeadersAdded = true;
    WebViewUtils.headers.forEach((val, key) => {
      areHeadersAdded = areHeadersAdded && request.valueForHTTPHeaderField(key) === val;
    });

    if (!isHttpRequest || isNavigationTypeBackForward || areHeadersAdded || urlString === "about:blank") {
      return this._originalDelegate.webViewShouldStartLoadWithRequestNavigationType(webView, request, navigationType);
    }

    const nsMutableURLRequest = new NSMutableURLRequest({
      URL: request.URL,
      cachePolicy: NSURLRequestCachePolicy.UseProtocolCachePolicy,
      timeoutInterval: 60
    });

    WebViewUtils.headers.forEach((val, key) => {
      nsMutableURLRequest.setValueForHTTPHeaderField(val, key);
    });

    webView.loadRequest(nsMutableURLRequest);
    return false;
  }

  public webViewDidStartLoad(webView: UIWebView) {
    this._originalDelegate.webViewDidStartLoad(webView);
  }

  public webViewDidFinishLoad(webView: UIWebView) {
    this._originalDelegate.webViewDidFinishLoad(webView);
  }

  public webViewDidFailLoadWithError(webView: UIWebView, error: NSError) {
    this._originalDelegate.webViewDidFailLoadWithError(webView, error);
  }
}
