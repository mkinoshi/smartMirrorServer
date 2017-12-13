This project is intended for the Ubuntu platform

Installation of Software:

1. Install NodeJs with the following in a command prompt: sudo apt-get install node
2. Clone the git hub with the following: git clone https://github.com/mkinoshi/smartMirrorServer
3. Cd into the directory
4. Update the packages for node: npm install
5. Start the node server with: node app.js
6. Install opencv3.2.0 by following these steps listed here: http://www.samontab.com/web/2017/06/installing-opencv-3-2-0-with-contrib-modules-in-ubuntu-16-04-lts/
7. Cd into the python directory
8. Start the python client with: python main.py
9. Open a web browser to localhost:3000
10. Once there, if the camera detects the correct face it will take the user to localhost:3000/email


Optional:
If you do not look like Gerardo Diaz (The correct face), with your web browser go to localhost:3000/email manually by typing it into the url, it will display all of the info
Edit preferences like RSS feed by changing jerry.txt line 4. Get sources from apinews.org that work
Edit preferences like Alarm time by changing alarm.txt to a military time for the alarm to sound.