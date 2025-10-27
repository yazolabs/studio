FROM php:8.2-apache

ARG UID
ARG GID

RUN apt-get update && \
    apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    libzip-dev && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    docker-php-ext-configure zip && \
    docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN a2enmod rewrite && \
    sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

RUN groupmod -g ${GID:-1000} www-data && \
    usermod -u ${UID:-1000} -g www-data www-data

WORKDIR /var/www/html
