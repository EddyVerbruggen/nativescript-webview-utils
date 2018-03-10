import { LoadEventData, NavigationType } from "tns-core-modules/ui/web-view";
import { Observable } from "tns-core-modules/ui/core/bindable";

export function onLoadStarted(observable: Observable, url: string, navigationType: NavigationType) {
  let args = <LoadEventData>{
    eventName: "loadStarted",
    object: observable,
    url: url,
    navigationType: navigationType,
    error: undefined
  };

  observable.notify(args);
}

export function onLoadFinished(observable: Observable, url: string, error?: string) {
  let args = <LoadEventData>{
    eventName: "loadFinished",
    object: observable,
    url: url,
    navigationType: undefined,
    error: error
  };

  observable.notify(args);
}
