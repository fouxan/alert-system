FROM fluent/fluentd:v1.17.0-1.0

USER root

RUN fluent-gem install fluent-plugin-kafka fluent-plugin-google-cloud-pubsub-custom fluent-plugin-elasticsearch

USER fluent

COPY fluent.conf /fluentd/etc/

CMD exec fluentd -c /fluentd/etc/fluent.conf -p /fluentd/plugins --no-supervisor
