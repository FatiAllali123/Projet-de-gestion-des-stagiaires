import { Component } from '@angular/core';
import { NavBarComponent } from '../shared/nav-bar/nav-bar.component';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-page-accueil.component',
  imports: [NavBarComponent,RouterModule],
  templateUrl: './page-accueil.component.html',
  styleUrl: './page-accueil.component.css'
})
export class PageAccueilComponent {

}
