############################################################
# Dockerfile to build Super-NetOps enablement container
# Based on Alpine Linux, seasoned with tools and workflows
############################################################

# Start with an awesome, tiny Linux distro.
FROM alpine:latest

MAINTAINER Nathan Pearce

ENV REPO_RAW https://raw.githubusercontent.com/npearce/f5_iot_demo/master
ENV LOCAL_PATH /f5_iot_demo

https://raw.githubusercontent.com/npearce/f5_iot_demo/master/iot_client.js

# Update the Alpine package database
RUN apk update

# Install Node.js
RUN apk add nodejs

ADD $REPO_RAW/f5_iot_demo/iot_client_inputs.json .
ADD $REPO_RAW/f5_iot_demo/iot_client.js .

CMD /usr/bin/node LOCAL_PATH/iot_client.js
