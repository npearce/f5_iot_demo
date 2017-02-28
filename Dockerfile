############################################################
# Dockerfile to build Super-NetOps enablement container
# Based on Alpine Linux, seasoned with tools and workflows
############################################################

# Start with an awesome, tiny Linux distro.
FROM alpine:latest

MAINTAINER Nathan Pearce

ENV REPO https://github.com/npearce
ENV REPO_RAW https://github.com/npearce


# Upgrade the Alpine package system
RUN apk update && apk upgrade

# Install Node.js
RUN apk add nodejs

ADD $REPO/npearce/f5_iot_demo/
