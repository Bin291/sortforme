import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(withEventReplay()), provideFirebaseApp(() => initializeApp({ projectId: "sortforme-9e3a4", appId: "1:1026570661908:web:6fe9780564748671707701", storageBucket: "sortforme-9e3a4.firebasestorage.app", apiKey: "AIzaSyC2d128-sM_jQlRqe1GKIjCMOLjX_M2YSU", authDomain: "sortforme-9e3a4.firebaseapp.com", messagingSenderId: "1026570661908", measurementId: "G-SFWSEGFH9H" })), provideAuth(() => getAuth())]
};
