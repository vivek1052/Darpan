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

- Map the folder having unorganised photos in docker-compose.yml file. Folder should be named "Import"

<kbd>
<img width="837" alt="Snag_a790aa" src="https://user-images.githubusercontent.com/42589837/173919760-a272368a-dc75-4672-9cd9-09beb5742946.png">
</kbd>
  
- Login to UI using admin rights.

<kbd>
<img width="837" alt="Snag_ab11e2" src="https://user-images.githubusercontent.com/42589837/173920414-da888a29-3680-4e8a-8641-211998d91e0b.png">
</kbd>
  
- The folder structure will appear on the import screen. Select the folder and click on Import. Photos will be imported in background detached from the main process.

<kbd>
<img width="546" alt="Snag_aabfda" src="https://user-images.githubusercontent.com/42589837/173920360-e6c93ad6-822b-45e1-a99f-ec2eecb9f8ba.png">
</kbd>

<kbd>
<img width="945" alt="Snag_ad209e" src="https://user-images.githubusercontent.com/42589837/173920798-03947bc6-ae3d-43ea-adbb-f009aaa3c086.png">
</kbd>
  
- Once photos are imported, they will be sorted and moved into folders in sequence **Year=>Month** in folder "Export".

<kbd>
<img width="443" alt="Snag_afd3d7" src="https://user-images.githubusercontent.com/42589837/173921258-a46bc286-e02f-46d4-adec-198b7d79ad10.png">
</kbd>
  
- On UI, photos will be arranged date wise. **Photos are loaded as we scroll to the timeline to prevent bogging your browser with hundereds of cached photos ensuring smooth scrolling**.

https://user-images.githubusercontent.com/42589837/173921764-d4388a95-f01f-4add-a0ad-c79a97647c57.mp4

- It comes with the fullscreen viewer so that you can utilize your widescreen monitor.

<kbd>
<img width="960" alt="Snag_b923c0" src="https://user-images.githubusercontent.com/42589837/173922832-eb45bac4-9c25-4c56-b513-0a41882337d9.png">
</kbd>

- Mass actions are supported on photos including updating Date time using a **fixed date or a date period**.

<kbd>
  <img width="960" alt="Snag_b5eafb" src="https://user-images.githubusercontent.com/42589837/173922304-06270e48-4a3a-4fba-b36f-18818d98e8af.png">
</kbd>

<kbd>
  <img width="960" alt="Snag_b604ae" src="https://user-images.githubusercontent.com/42589837/173922327-01459df3-1b0d-4462-b4a6-1f78bebf3b2a.png">
</kbd>
  
- Location can be updated for one or multiple photos.

<kbd>
<img width="960" alt="Snag_b7f032" src="https://user-images.githubusercontent.com/42589837/173922618-84622bbd-cfd9-42fe-86c7-cd7eeb713d8e.png">
</kbd>

- Multiple photos can be grouped into albums.

<kbd>
<img width="960" alt="Snag_ba1247" src="https://user-images.githubusercontent.com/42589837/173922987-5348a405-994d-4e49-8f8d-0331f6fe6034.png">
</kbd>

<kbd>
<img width="960" alt="Snag_ba2b6c" src="https://user-images.githubusercontent.com/42589837/173923002-5593c207-abde-4392-8361-7410b7e83545.png">
</kbd>

<kbd>
<img width="960" alt="Snag_ba4acb" src="https://user-images.githubusercontent.com/42589837/173923028-0570f50c-a00b-4f0c-9a49-759d53171f99.png">
</kbd>

<kbd>
<img width="960" alt="Snag_ba6e9f" src="https://user-images.githubusercontent.com/42589837/173923056-180db58a-4ad0-4f35-a159-5ce9f00f6198.png">
</kbd>
