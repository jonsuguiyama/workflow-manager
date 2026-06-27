import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppMainComponent } from './app/app.main.component';

bootstrapApplication(AppMainComponent, appConfig)
  .catch((err) => console.error(err));
