import { Routes } from '@angular/router';
import { adminGuard, authGuard } from '@guards/guards';

export const routes: Routes = [
  // Admin Login (Canvas independiente sin layout)
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/auth/pages/admin-login.component').then((m) => m.AdminLoginComponent)
  },

  // Panel Administrativo protegido por adminGuard
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/pages/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: 'materiales',
        loadComponent: () =>
          import('./features/admin/materials/pages/admin-materials.component').then(
            (m) => m.AdminMaterialsComponent
          )
      },
      {
        path: 'flota',
        loadComponent: () =>
          import('./features/admin/fleet/pages/admin-fleet.component').then(
            (m) => m.AdminFleetComponent
          )
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/admin/customers/pages/admin-customers.component').then(
            (m) => m.AdminCustomersComponent
          )
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./features/admin/sales/pages/admin-sales.component').then(
            (m) => m.AdminSalesComponent
          )
      },
      {
        path: 'excel',
        loadComponent: () =>
          import('./features/admin/excel/pages/admin-excel.component').then(
            (m) => m.AdminExcelComponent
          )
      }
    ]
  },

  // Portal Público
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      // Rutas públicas de acceso y error
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login.component').then((m) => m.LoginComponent)
      },
      {
        path: 'ingreso',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register.component').then((m) => m.RegisterComponent)
      },
      {
        path: 'registro',
        redirectTo: 'register',
        pathMatch: 'full'
      },
      {
        path: '403',
        loadComponent: () =>
          import('./features/public/pages/error-page.component').then(
            (m) => m.ErrorPageComponent
          ),
        data: { code: 403 }
      },
      {
        path: '404',
        loadComponent: () =>
          import('./features/public/pages/error-page.component').then(
            (m) => m.ErrorPageComponent
          ),
        data: { code: 404 }
      },
      {
        path: '500',
        loadComponent: () =>
          import('./features/public/pages/error-page.component').then(
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
              import('./features/materials/pages/products.component').then(
                (m) => m.ProductsComponent
              )
          },
          {
            path: 'flota',
            loadComponent: () =>
              import('./features/fleet/pages/vehicles.component').then(
                (m) => m.VehiclesComponent
              )
          },
          {
            path: 'cotizaciones',
            loadComponent: () =>
              import('./features/fleet/pages/rentals.component').then(
                (m) => m.RentalsComponent
              )
          },
          {
            path: 'proyectos',
            loadComponent: () =>
              import('./features/public/pages/soon.component').then(
                (m) => m.SoonComponent
              )
          },
          {
            path: 'carrito',
            loadComponent: () =>
              import('./features/cart/pages/cart.component').then(
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
