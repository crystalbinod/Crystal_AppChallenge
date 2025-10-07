// index.tsx  (optional; OK to delete if you stick with App.tsx-only)
import { registerRootComponent } from 'expo';
//imports the App function from Apptsx
import App from './App';
//renders the app React Native view on Android, iOS, tvOS and the web.
registerRootComponent(App);