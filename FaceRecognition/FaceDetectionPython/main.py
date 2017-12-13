import cv2
import numpy as np
import sys
import time
import requests


'''
	Main file to detect human faces
'''

def get_images_and_labels(folderpath):
	'''
		Returns a list of images and a list of labels for the subject of those images. 
		Initially, the labels will all be '1' as the system will be tested using only one 
		user 

		folderpath is the path of the folder where the images are kept relative to the folder
		from where the user's main program is being run 
	'''

	#load pre-built opencv XML trained classifiers
	face_cascade = cv2.CascadeClassifier('./haarcascade_frontalface_default.xml')
	basic_paths = folderpath + '/user1_'

	images = []
	labels =[]

	for i in range(19,53):
		#read all of the images containing jerry's face
		src = cv2.imread(basic_paths+ '%02d.jpg' % (i), cv2.IMREAD_GRAYSCALE )
		#jerry's face (ID 01) is the only recognized
		label = 1 

		faces = face_cascade.detectMultiScale(src, minSize = (200,200))

		for (x, y, w, h) in faces:

			labels.append(label)
			images.append(src[y: y + h, x: x + w])

	return images, labels

def sendFound():
	'''
		sends a message to the server hosting the mirror webpage telling it that the user has been found
	'''
	try :
		r = requests.post("http://137.146.139.43:3000/detected/", data={'user': 'Jerry'})
	except:
		print "CANNOT CONNECT TO SERVER -- Detection Data not Sent"


def sendLost():
	'''
		sends a message to the server hosting the mirror webpage telling it that the user has been found
	'''
	try:
		r = requests.post("http://137.146.139.43:3000/lost/", data={'user': 'Jerry'})
	except:
		print "CANNOT CONNECT TO SERVER -- LOST FACE DATA NOT SENT"

def scanForFace():

	'''
		scanForFace initializes the facial recognition mechanisms in the SETUP phase. Then, it enters an infinite loop 
		during which it takes in the current frame coming from the video feed. It scans that frame for faces using opencv's 
		detectmultiScale function and an existing trained haar cascade classifier. 

		If a face is found, then the face is processed by a face recognizer which returns a 
		confidence floating point value. This value is the distance from the face that the 
		recognizer has been trained to identify. If the value is below a certain threshold 
		(in the current version of the software the threshold is 195.0), then the function
		acknowledges the face being scanned as a valid user's face. The program will then 
		go over 35 cycles of face recognition and then find the percentage of times that a valid
		face was scanned. If on average, a valid face was scanned over 60% of the time, then 
		the program will call on the sendFound function to tell the information server that
		a valid user is in front of the camera. 

		Lastly, if no user is recognized for 30 seconds after accessing the information screen, 
		another message will be sent to the server to stop displaying the user's information  
	
	'''

	#---- SETUP OPENCV COMPONENTS --------------------------------------------------------
	#get the lists of images and labels from the appropriate folder
	images, labels = get_images_and_labels("../FaceDatabase")
	
	#train a face recognizer using the images and labels
	recognizer = cv2.face.createLBPHFaceRecognizer(grid_x=12, grid_y=12)
	recognizer.train(images, np.array(labels))

	#train a general face detecting casade 
	face_cascade = cv2.CascadeClassifier('./haarcascade_frontalface_default.xml')

	#set up video capture
	cap = cv2.VideoCapture(0)

	#set up a fullscreen window
	cv2.namedWindow('src', cv2.WND_PROP_FULLSCREEN)
	cv2.setWindowProperty('src',cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
	#------------------------------------------------------------------

	
	#initialize variables
	loopCount = 0
	total_sum = 0
	start_time = time.time()
	found = False 
	
	
	#infinite loop and logic
	while True:
		
		#read the current frame
		retval, src = cap.read()
		
		#no image could be obtained from the camera
		if not retval:
			print "CANNOT READ FRAME FROM VideoCapture"
			sys.exit()

		#get faces in the frame and handle the case with no faces
		gray_img = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY )
		faces = face_cascade.detectMultiScale(gray_img,1.3,minSize = (140,140),  maxSize=(180,180))
		
		if faces == ():
			cv2.imshow('src', src)
			total_sum += 0
			cv2.waitKey(1)

		#if a face is found
		else:
			
			for face in faces:

				x = face[0]
				y = face[1]
				w = face[2]
				h = face[3]

				#display a red rectangle around the face if over a 
				#confidence threshold of 195.0 or green if under that same threshold
				predicted, conf = recognizer.predict(gray_img[y: y + h, x: x+ w])
				
				if conf < 195.0:
					color = (0,255,0)
					total_sum += 1
				else:
					color = (0,0,255)
					total_sum += 0

				src = cv2.rectangle(src, (x,y), (x+w, y+h), color, 2 )

				cv2.imshow('src', src)
				cv2.waitKey(1)
#=============================================================================================

'''

if loopCount == 35:
			
			print total_sum/35.0

			if (total_sum/35.0) > 0.6:
				
				print 'user found at %s seconds' % time.time()

				found = True 
				lost = False 
				r = requests.post("http://127.0.0.1:3000/detected/", data={'user': 'Jerry'})
				start_time = time.time()

			elif found == True and lost == False:
				if (time.time() - start_time) > 60.0:
					found = False
					lost = True
					r = requests.post("http://127.0.0.1:3000/lost/", data={'user': 'Jerry'})
					print 'user lost at %s seconds' % time.time()

			total_sum = 0		
			loopCount = 0

Above code is the original 'dirty' version. I refactored it by extracting two methods sendFound and sendLost. 
I also more clearly commented them and cleaned up the logic by eliminating an unnecessary boolean variable 



'''




#=================================================================================================
		#keep track of every cycle that finishes
		loopCount +=1

		if loopCount == 35:
			#if a valid user is found over 60% of the time then reset the wait timer
			#and if the found message has not been sent, send it
			if (total_sum/35.0) > 0.6:
				
				start_time = time.time()

				if found == False:
					#send a message 
					print 'user found' 
					found = True 
					sendFound()
				
			#if the user has been found and there's been over thirty seconds without having
			#found them again, then send a lost message 
			elif found == True:
				if (time.time() - start_time) > 30.0:
					found = False
					sendLost()
					print 'user lost'

			total_sum = 0		
			loopCount = 0
				
				

	
		
		


if __name__ == "__main__":
	#ensures we can use these functions in the future
	scanForFace()
	
