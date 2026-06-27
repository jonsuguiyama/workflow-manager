import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(false);

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
    if (this.isLoading()) return;

    this.isLoading.set(true);

    this.authService.loginAsDemo().subscribe({
      next: () => {
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        console.error('Authentication failed:', err);
        this.isLoading.set(false);
      }
    });
  }
}
