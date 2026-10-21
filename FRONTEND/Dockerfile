
FROM nginx:alpine

COPY index.html tasks.html projects.html reports.html login.html register.html /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
