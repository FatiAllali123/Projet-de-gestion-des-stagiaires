import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; // adapte le chemin

import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ChangePassword } from './components/change-password/change-password';
import { ProfilComponent } from './components/profil/profil.component';
import { NotificationsComponent } from './components/notifications/notifications';
import { StaffManagementComponent } from './components/staff-management/staff-management.component';
import {  GestionOffresComponent } from './components/gestion-offres/gestion-offres';
import{HomePageComponent} from './components/home-page/home-page.component';
import { GestionCandidaturesComponent } from './components/gestion-candidatures/gestion-candidatures.component';
import { ListeOffresComponent } from './components/gestion-candidatures/liste-offres/liste-offres.component';
import { PageAccueilComponent } from './components/page-accueil.component/page-accueil.component';
import { MesCandidaturesComponent } from './components/mes-candidatures/mes-candidatures';

export const routes: Routes = [
  { path: '', redirectTo: '/Home', pathMatch: 'full' },  // redirection à l'ouverture
 { path: 'Offres', component: HomePageComponent  },
  
   {path: 'Home',component: PageAccueilComponent},
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
   { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
   { path: 'dashboard', component: DashboardComponent , canActivate: [AuthGuard] },
    { path: 'changer-password', component: ChangePassword , canActivate: [AuthGuard] },
    { path: 'profil', component: ProfilComponent , canActivate: [AuthGuard]},
    { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard]},
    { path: 'admin/staff', component: StaffManagementComponent },
    {path: 'gestion-offres',component: GestionOffresComponent},
    {path: 'gestion-candidatures',
    component: GestionCandidaturesComponent, // Composant conteneur
    children: [
      { path: '', component: ListeOffresComponent }, // Route par défaut
      { path: ':offre_id', component: GestionCandidaturesComponent } // Détails candidatures
    ]
  },




];
