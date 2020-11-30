import { WebView } from "@nativescript/core";

export const WebViewUtils: {
  addHeaders: (wv: WebView, headers: Map<string, string>) => void;
};
