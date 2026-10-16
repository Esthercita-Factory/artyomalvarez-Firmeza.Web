import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicFooterComponent } from '@components/public-footer.component';
import { PublicHeaderComponent } from '@components/public-header.component';
import { AuthService } from '@services/auth.service';
import { CartService } from '@services/cart.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, PublicHeaderComponent, PublicFooterComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-[#F4F4F2] text-carbon">
      <app-public-header
        [cartCount]="cart.count()"
        [loggedIn]="auth.isLoggedIn()"
        [admin]="auth.isAdmin()"
        (logout)="auth.logout('/login')"
      />

      <main class="legacy flex-1 min-h-[calc(100vh-140px)]">
        <router-outlet />
      </main>

      <app-public-footer />
    </div>
  `
})
export class PublicLayoutComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
}
