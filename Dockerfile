# Gunakan Nginx yang ringan sebagai "pelayan" web kita
FROM nginx:alpine

# Salin file konfigurasi kustom kita ke dalam image
COPY ./default.conf /etc/nginx/conf.d/default.conf

# Salin sisa file aplikasi
COPY . /usr/share/nginx/html
