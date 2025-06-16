import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// 🚀 Глобальное отключение console.log в production
if (environment.production) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  // console.error оставляем для отладки критичных ошибок
}

bootstrapApplication(AppComponent, {
  providers: appConfig.providers,
}).catch((err) => console.error(err));
