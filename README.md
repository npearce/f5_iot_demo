# F5 IoT demo
Doing really cool things with the iControlLX framework


# Interactive mode
docker run --rm -it npearce/f5_iot_demo /bin/sh

# Drone mode
docker run --rm -it npearce/f5_iot_demo node /f5_iot_demo/iot_client.js [x.x.x.x]

Where x.x.x.x is the IP address of the demo iControl REST extension.


# Batch run

Remove `-it` and add `-d` (daemon mode):

```
for i in {1..15}; do docker run -d --name server$i npearce/f5_iot_demo node /f5_iot_demo/iot_client.js 172.31.1.10; sleep 5; done
```


# Batch cleanup
for i in {1..15}; do restcurl -u admin:admin -X DELETE /mgmt/demo/dashboard/172.17.0.$i; done
