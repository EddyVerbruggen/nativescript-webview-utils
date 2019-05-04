import { NavigationType, WebView } from "tns-core-modules/ui/web-view";
import { onLoadFinished, onLoadStarted } from "./webview-utils-common";

class WebviewUtilsWKNavigationDelegateImpl extends NSObject implements WKNavigationDelegate {
  private headers: Map<string, string>;
  public static ObjCProtocols = [WKNavigationDelegate];

  public static initWithOwnerAndHeaders(owner: WeakRef<WebView>, headers: Map<string, string>): WebviewUtilsWKNavigationDelegateImpl {
    const handler = <WebviewUtilsWKNavigationDelegateImpl>WebviewUtilsWKNavigationDelegateImpl.new();
    handler._owner = owner;
    handler.headers = headers;
    return handler;
  }

  private _owner: WeakRef<WebView>;

  webViewDecidePolicyForNavigationActionDecisionHandler(webView: WKWebView, navigationAction: WKNavigationAction, decisionHandler: (p1: WKNavigationActionPolicy) => void): void {
    const owner = this._owner.get();
    if (!owner || !navigationAction.request.URL) {
      return;
    }

    const isHttpRequest = navigationAction.request.URL.absoluteString.indexOf("http") === 0;

    let areHeadersAdded = true;
    this.headers.forEach((val, key) => {
      areHeadersAdded = areHeadersAdded && navigationAction.request.valueForHTTPHeaderField(key) === val;
    });

    if (isHttpRequest && !areHeadersAdded) {
      if (navigationAction.request.HTTPMethod !== "GET") {
        decisionHandler(WKNavigationActionPolicy.Allow);
        return;
      }

      decisionHandler(WKNavigationActionPolicy.Cancel);

      const customRequest = navigationAction.request.mutableCopy();

      // add the original headers
      for (let i = 0; i < navigationAction.request.allHTTPHeaderFields.count; i++) {
        const headerKey = navigationAction.request.allHTTPHeaderFields.allKeys.objectAtIndex(i);
        customRequest.setValueForHTTPHeaderField(
            navigationAction.request.allHTTPHeaderFields.objectForKey(headerKey),
            headerKey);
      }

      this.headers.forEach((val, key) => {
        customRequest.setValueForHTTPHeaderField(val, key);
        // the user agent is set as header, but also set this property:
        if (key.toLowerCase() === "user-agent") {
          webView.customUserAgent = val;
        }
      });

      webView.loadRequest(customRequest);
    } else {
      decisionHandler(WKNavigationActionPolicy.Allow);

      let navType: NavigationType = "other";

      switch (navigationAction.navigationType) {
        case WKNavigationType.LinkActivated:
          navType = "linkClicked";
          break;
        case WKNavigationType.FormSubmitted:
          navType = "formSubmitted";
          break;
        case WKNavigationType.BackForward:
          navType = "backForward";
          break;
        case WKNavigationType.Reload:
          navType = "reload";
          break;
        case WKNavigationType.FormResubmitted:
          navType = "formResubmitted";
          break;
      }
      onLoadStarted(owner, navigationAction.request.URL.absoluteString, navType);
    }
  }

  public webViewDidFinishNavigation(webView: WKWebView, navigation: WKNavigation): void {
    const owner = this._owner.get();
    if (owner) {
      let src = owner.src;
      if (webView.URL) {
        src = webView.URL.absoluteString;
      }
      onLoadFinished(owner, src);
    }
  }

  public webViewDidFailNavigationWithError(webView: WKWebView, navigation: WKNavigation, error: NSError): void {
    const owner = this._owner.get();
    if (owner) {
      let src = owner.src;
      if (webView.URL) {
        src = webView.URL.absoluteString;
      }
      onLoadFinished(owner, src, error.localizedDescription);
    }
  }
}

export class WebViewUtils extends NSObject implements UIWebViewDelegate {
  public static ObjCProtocols = [UIWebViewDelegate];

  // Note that using a static property limits usage of multiple webviews on one page with different headers,
  // but I don't think that is ever a real usecase for anyone.
  private static headers: Map<string, string>;

  private _owner: WeakRef<WebView>;
  private _originalDelegate: any; // UIWebViewDelegateImpl

  public static addHeaders(wv: WebView, headers: Map<string, string>) {
    if (WebViewUtils.isWKWebView(wv)) {
      (<WKWebView>wv.ios).navigationDelegate = (<any>wv)._delegate = WebviewUtilsWKNavigationDelegateImpl.initWithOwnerAndHeaders(new WeakRef(wv), headers);
    } else {
      (<any>wv)._delegate = WebViewUtils.initWithOwner(new WeakRef(wv));
      WebViewUtils.headers = headers;
    }
  }

  /**
   * NativeScript < 3.4 used UIWebView. Newer versions use WKWebView.
   * So one day the UIWebView code can be removed.
   * @param {WebView} wv
   * @returns {boolean}
   */
  private static isWKWebView(wv: WebView): boolean {
    return wv.ios.isKindOfClass(WKWebView.class());
  }

  private static initWithOwner(owner: WeakRef<WebView>): WebViewUtils {
    let delegate = new WebViewUtils();
    delegate._owner = owner;
    delegate._originalDelegate = (<any>owner.get())._delegate;
    return delegate;
  }

  // UIWebView delegate
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

    // add the original headers
    for (let i = 0; i < request.allHTTPHeaderFields.count; i++) {
      const headerKey = request.allHTTPHeaderFields.allKeys.objectAtIndex(i);
      nsMutableURLRequest.setValueForHTTPHeaderField(
          request.allHTTPHeaderFields.objectForKey(headerKey),
          headerKey);
    }

    WebViewUtils.headers.forEach((val, key) => {
      nsMutableURLRequest.setValueForHTTPHeaderField(val, key);
      if (key.toLowerCase() === "user-agent") {
        // note that this overrides the useragent for ALL webviews for the app, but that's prolly not a problem
        NSUserDefaults.standardUserDefaults.registerDefaults(
            NSDictionary.dictionaryWithObjectForKey(val, "UserAgent"));
      }
    });

    webView.loadRequest(nsMutableURLRequest);
    return false;
  }

  // UIWebView delegate
  public webViewDidStartLoad(webView: UIWebView) {
    this._originalDelegate.webViewDidStartLoad(webView);
  }

  // UIWebView delegate
  public webViewDidFinishLoad(webView: UIWebView) {
    this._originalDelegate.webViewDidFinishLoad(webView);
  }

  // UIWebView delegate
  public webViewDidFailLoadWithError(webView: UIWebView, error: NSError) {
    this._originalDelegate.webViewDidFailLoadWithError(webView, error);
  }
}
