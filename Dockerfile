# Servidor web ligero Nginx para la SPA Angular (Firmeza.Client)
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

# Limpiar archivos por defecto
RUN rm -rf ./*

# Copiar bundle optimizado de producción y configuración de Nginx con SPA fallback
COPY dist/firmeza-web/browser/ .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
