const rev = `
location / {
    proxy_pass                         http://wordpress:80;
    proxy_http_version                 1.1;
    proxy_cache_bypass                 $http_upgrade;

    # Proxy headers
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        "upgrade";
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
    proxy_set_header X-Forwarded-Port  $server_port;

    # Proxy timeouts
    proxy_connect_timeout              60s;
    proxy_send_timeout                 60s;
    proxy_read_timeout                 60s;
}
`;

const config = `
user                 www-data;
pid                  /run/nginx.pid;
worker_processes     auto;
worker_rlimit_nofile 65535;

events {
    multi_accept       on;
    worker_connections 65535;
}

http {
    charset              utf-8;
    sendfile             on;
    tcp_nopush           on;
    tcp_nodelay          on;
    server_tokens        off;
    log_not_found        off;
    types_hash_max_size  2048;
    client_max_body_size 16M;

    # MIME
    include              mime.types;
    default_type         application/octet-stream;

    # Logging
    # access_log           /var/log/nginx/access.log;
    # error_log            /var/log/nginx/error.log warn;

    # Load configs
    include              /etc/nginx/conf.d/*.conf;

    # suka.com
    server {
        listen                             80;
        listen                             [::]:80;
        server_name                        suka.com;

        # security headers
        add_header X-Frame-Options         "SAMEORIGIN" always;
        add_header X-XSS-Protection        "1; mode=block" always;
        add_header X-Content-Type-Options  "nosniff" always;
        add_header Referrer-Policy         "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # . files
        location ~ /\.(?!well-known) {
            deny all;
        }

        # reverse proxy
        ${rev}

        # favicon.ico
        location = /favicon.ico {
            log_not_found off;
            access_log    off;
        }

        # robots.txt
        location = /robots.txt {
            log_not_found off;
            access_log    off;
        }

        # gzip
        gzip            on;
        gzip_vary       on;
        gzip_proxied    any;
        gzip_comp_level 6;
        gzip_types      text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;
    }
    server {
        listen      80;
        listen      [::]:80;
        server_name *.suka.com;
        return      301 http://suka.com$request_uri;
    }
}
`;

export { config };
