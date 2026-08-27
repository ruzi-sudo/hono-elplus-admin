FROM mysql:8.0

ARG MYSQL_ROOT_PASSWORD
ENV MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-root123}
ENV DB_HOST=infra

RUN microdnf install -y redis && microdnf clean all

COPY docker/db.cnf /etc/mysql/conf.d/db.cnf
COPY docker/init.sql /docker-entrypoint-initdb.d/
COPY docker/start-services.sh /usr/local/bin/start-services.sh

RUN chmod +x /usr/local/bin/start-services.sh

EXPOSE 3306 6379

CMD ["/usr/local/bin/start-services.sh"]
