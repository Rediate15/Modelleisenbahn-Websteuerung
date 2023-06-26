# Modelleisenbahn Websteuerung

## Installation

Clone the repository
```sh
git clone https://github.com/Rediate15/maerklin-can-http-service.git
# or
git clone git@github.com:Rediate15/maerklin-can-http-service.git
```

## Starting the frontend

To setup and start the frontend application go into the frontend folder by executing ```cd frontend``` and follow the instructions given in the [README](frontend/README.md)

## Starting the backend

To setup and start the backend service go into the backend folder by executing ```cd backend``` and follow the instructions given in the [README](backend/README.md)

Alternatively when using the prepared Raspberry Pi the setup instructions can be skipped. Follow the following instructions to start the backend service

### Using prepared Raspberry Pi
To connect to the prepared Raspberry Pi establish an SSH connection to the pi. At the point of writing this, the IP is ```193.196.7.37```, the username ```user``` and the password ```123```. For the connection tools like Putty can be used.

After successfully connecting to the pi, the backend services can be started individually.
```
python src/start.py raw_can_receiver
python src/start.py raw_can_sender
python src/start.py can_receiver
python src/start.py can_sender
python src/start.py can
```

Alternatively all required services can be started using tmux:
```tmuxp load ./assets/camera-controll.tmuxp.yaml```