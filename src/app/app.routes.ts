import { Routes } from '@angular/router';
import { adminGuard, authGuard } from '@guards/guards';

export const routes: Routes = [
  // Admin Login (Canvas independiente sin layout)
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./pages/admin/admin-login.component').then((m) => m.AdminLoginComponent)
  },

  // Panel Administrativo protegido por adminGuard
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./layouts/admin-layout').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: 'materiales',
        loadComponent: () =>
          import('./pages/admin/admin-materials.component').then(
            (m) => m.AdminMaterialsComponent
          )
      },
      {
        path: 'flota',
        loadComponent: () =>
          import('./pages/admin/admin-fleet.component').then(
            (m) => m.AdminFleetComponent
          )
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/admin/admin-customers.component').then(
            (m) => m.AdminCustomersComponent
          )
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./pages/admin/admin-sales.component').then(
            (m) => m.AdminSalesComponent
          )
      },
      {
        path: 'excel',
        loadComponent: () =>
          import('./pages/admin/admin-excel.component').then(
            (m) => m.AdminExcelComponent
          )
      }
    ]
  },

  // Portal Público
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout').then((m) => m.PublicLayoutComponent),
    children: [
      // Rutas públicas de acceso y error
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/public/login.component').then((m) => m.LoginComponent)
      },
      {
        path: '403',
        loadComponent: () =>
          import('./pages/public/error-page.component').then(
            (m) => m.ErrorPageComponent
          ),
        data: { code: 403 }
      },
      {
        path: '404',
        loadComponent: () =>
          import('./pages/public/error-page.component').then(
            (m) => m.ErrorPageComponent
          ),
        data: { code: 404 }
      },
      {
        path: '500',
        loadComponent: () =>
          import('./pages/public/error-page.component').then(
            (m) => m.ErrorPageComponent
          ),
        data: { code: 500 }
      },

      // Rutas protegidas por authGuard
      {
        path: '',
        canActivate: [authGuard],
        children: [
          {
            path: '',
            redirectTo: 'materiales',
            pathMatch: 'full'
          },
          {
            path: 'materiales',
            loadComponent: () =>
              import('./pages/public/products.component').then(
                (m) => m.ProductsComponent
              )
          },
          {
            path: 'flota',
            loadComponent: () =>
              import('./pages/public/vehicles.component').then(
                (m) => m.VehiclesComponent
              )
          },
          {
            path: 'cotizaciones',
            loadComponent: () =>
              import('./pages/public/rentals.component').then(
                (m) => m.RentalsComponent
              )
          },
          {
            path: 'proyectos',
            loadComponent: () =>
              import('./pages/public/soon.component').then(
                (m) => m.SoonComponent
              )
          },
          {
            path: 'carrito',
            loadComponent: () =>
              import('./pages/public/cart.component').then(
                (m) => m.CartComponent
              )
          }
        ]
      }
    ]
  },

  // Redirección comodín
  {
    path: '**',
    redirectTo: '404'
  }
];
