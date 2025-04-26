import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
<<<<<<< HEAD

bootstrapApplication(AppComponent, {
  providers: appConfig.providers,
}).catch((err) => console.error(err));
=======
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent ,{providers:[provideRouter(routes)]},)
  .catch((err) => console.error(err));
>>>>>>> origin/main
