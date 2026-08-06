import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <a href="#main-content" class="skip-link">Skip to content</a>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .skip-link {
      position: absolute;
      top: -100px;
      left: 8px;
      z-index: 2000;
      background: #4f8cff;
      color: white;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      text-decoration: none;
      transition: top .15s ease;
    }

    .skip-link:focus {
      top: 8px;
    }
  `]
})
export class AppMainComponent {}
