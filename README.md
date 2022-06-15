# Darpan
A Photo Gallery/Organizer(Passion Project) created with Vue & SAP Capire

Tired of ever growing/unorganized photos? 

This simple **self hosted application** that can sort and organize photos based on their metadata. Since this is a Dockerized application, a wide variety of platforms and hardwares are supported. Some being:

- Old Desktop/Laptop with X86 or AMD processors
- Nas devices
- Raspberrypi 3 and above

Docker-compose options:

- Environment Secret: Is used to sign JWT token used across systems.
- Volume/Pictures: Path to the folder where pictures are stored.
- Environment MAPAPIKEY: API key for Here maps in order to see geolocation from photo exif data.

Installation steps:

- Install Docker and Docker-Compose of your respective systems.
- On the root folder, execute **docker-compose up -d** to build and run docker containers in detached mode.
- Navigate to UI at localhost:80 or *ip-of-your-device-running-this-container*:80.
- There are two users: *admin* & *user*, *admin* having display as well as modification rights. *user* can only view the gallery.
- Initial password can be set using *darpan-authentication-server->users.json* file. Password needs to be encrypted using bcrypt.
- Same file can be used to set roles to the user.  

## How to use:

Map the folder having unorganised photos in docker-compose.yml file. Folder should be named "Import"

<img width="837" alt="Snag_a790aa" src="https://user-images.githubusercontent.com/42589837/173919760-a272368a-dc75-4672-9cd9-09beb5742946.png">
