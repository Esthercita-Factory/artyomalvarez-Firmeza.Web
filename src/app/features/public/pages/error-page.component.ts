import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    @let info = errorInfo();

    <div class="max-w-[1280px] mx-auto px-4 md:px-8 py-16 flex items-center justify-center">
      <section class="max-w-xl w-full flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white institutional-border rounded-xl gap-4 shadow-sm">
        <span class="material-symbols-outlined text-[64px] {{ info.iconColor }}">
          {{ info.icon }}
        </span>

        <span class="font-mono text-body-sm text-secondary-label font-bold uppercase tracking-widest">
          ERROR {{ info.code }}
        </span>

        <h2 class="font-headline-md text-headline-md text-carbon font-semibold">
          {{ info.title }}
        </h2>

        <p class="font-body-sm text-body-sm text-secondary-label max-w-md">
          {{ info.message }}
        </p>

        <a
          routerLink="/materiales"
          class="h-11 px-6 btn-primary-yellow font-semibold flex items-center gap-2 mt-2"
        >
          <span class="material-symbols-outlined text-[20px]">{{ info.btnIcon }}</span>
          <span>{{ info.btnText }}</span>
        </a>
      </section>
    </div>
  `
})
export class ErrorPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly errorInfo = computed(() => {
    const code = Number(this.route.snapshot.data['code'] ?? 404);

    if (code === 403) {
      return {
        code: 403,
        icon: 'gpp_bad',
        iconColor: 'text-error',
        title: 'No tienes permiso para ver esta sección',
        message:
          'Su rol de usuario actual no posee privilegios para consultar o modificar esta configuración de FIRMEZA S.A.S.',
        btnIcon: 'arrow_back',
        btnText: 'Volver al inicio'
      };
    }

    if (code === 500) {
      return {
        code: 500,
        icon: 'dns',
        iconColor: 'text-error',
        title: 'Error interno del servidor',
        message:
          'Ocurrió una anomalía al procesar la solicitud en el cluster de base de datos. Se ha generado un registro para soporte técnico.',
        btnIcon: 'refresh',
        btnText: 'Reintentar y volver'
      };
    }

    return {
      code: 404,
      icon: 'search_off',
      iconColor: 'text-secondary-label',
      title: 'Página no encontrada',
      message: 'La ruta solicitada no existe en el sistema o ha sido reubicada.',
      btnIcon: 'home',
      btnText: 'Volver al inicio'
    };
  });
}
