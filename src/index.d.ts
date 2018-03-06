import { WebView } from "tns-core-modules/ui/web-view";

export const WebViewUtils: {
  addHeaders: (wv: WebView, headers: Map<string, string>) => void;
};
