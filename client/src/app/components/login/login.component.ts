import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.authService.checkSession().subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          this.router.navigate(['/tasks']);
        }
      }
    });
  }

  onLoginDemo(): void {
    this.authService.loginAsDemo().subscribe({
      next: () => {
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        console.error('Authentication failed:', err);
      }
    });
  }
}
