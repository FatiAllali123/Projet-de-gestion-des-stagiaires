import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private sectionSubject = new Subject<{section: string, params?: any}>();
  section$ = this.sectionSubject.asObservable();

  navigate(section: string, params?: any) {

    this.sectionSubject.next({ section, params });
  }
}
