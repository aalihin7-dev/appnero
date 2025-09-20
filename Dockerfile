# Gunakan Nginx yang ringan sebagai "pelayan" web kita
FROM nginx:alpine

# Salin semua file dari folder proyek ini ke folder web di dalam "pot"
COPY . /usr/share/nginx/html
