### How to run the project:
Install the `babilado.apk` file on an Android device (at least Android 6.0) and run the application. The app will connect to a server hosted on Heroku cloud servers.


### How to run the server:

- Install PostgreSQL 13 (any 13.x version will work) (https://www.enterprisedb.com/downloads/postgres-postgresql-downloads). 
- Set up the server with at least one user (the instructions vary for different operating systems) and connect to it. 
- Run the `server.sql` queries to set up the database. 

- Install node.js 17 (any 17.x version will work) (https://nodejs.org/en/download/)
- Run the following command using PowerShell from the `babilado-backend` folder, replacing words in capitals with 
appropriate credentials of the PostgreSQL Server: `npm update; npx tsc --project tsconfig.json; ${env:DATABASE_URL}='postgres://USERNAME:PASSWORD@HOSTNAME:PORT/DATABASENAME'; node out/index.js`
- The console should now say `Listening at 5000`


### How to compile the application:

- Install Android Studio Bumblebee (any 2021.1.x version will work) (https://developer.android.com/studio#downloads)
- Open the `babilado-android` project folder in Android Studio
- Connect an Android device with ADB enabled and run the app from the run toobar
- On the login screen of the application click the settings button and replace API URL with the hostname of the server you set up above (i.e., http://YOURLOCALIP:5000/api)
