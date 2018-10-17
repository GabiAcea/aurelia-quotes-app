import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {FetchConfig} from 'aurelia-auth';
import AppRouterConfig from 'router-config';

// Using Aurelia's dependency injection, we inject Aurelia's router,
// the aurelia-auth http client config, and our own router config
// with the @inject decorator
@inject(Router, FetchConfig, AppRouterConfig)

export class App {

  constructor(router, fetchConfig, appRouterConfig) {

    this.router = router;
    this.text = "blablabla";

    // Client configuration provided by the aureliauth plugin
    this.fetchConfig = fetchConfig;

    // The application's configuration, including the
    // route definitions that we've declared in router-config.js
    this.appRouterConfig = appRouterConfig;
  };

  activate() {

    // Here we run the configuration when the app loads
    this.fetchConfig.configure();
    this.appRouterConfig.configure();

  };
}
