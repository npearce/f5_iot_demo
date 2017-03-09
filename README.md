# F5 IoT demo


# Interactive mode
docker run --rm -it npearce/f5_iot_demo /bin/sh

# Drone mode
docker run --rm -it npearce/f5_iot_demo node /f5_iot_demo/iot_client.js [x.x.x.x]

Where x.x.x.x is the IP address of the demo iControl REST extension.
