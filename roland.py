#-*- coding:UTF-8 -*-
from utils import clamp
import RPi.GPIO as GPIO

# Pinek
# Motor
IN1 = 20 # bal előre
IN2 = 21 # bal hátra
IN3 = 19 # jobb előre
IN4 = 26 # jobb hátra
ENA = 16 # bal sebesség (pwm)
ENB = 13 # jobb sebesség (pwm)

# RGB module pin
LED_R = 22
LED_G = 27
LED_B = 24

# TrackSensorLeftPin1 TrackSensorLeftPin2 TrackSensorRightPin1 TrackSensorRightPin2
#      	3                 5                  4                   18
TrackSensorLeftPin1  =  3    # The first tracking infrared sensor pin on the left is connected to  BCM port 3 of Raspberry pi
TrackSensorLeftPin2  =  5    # The second tracking infrared sensor pin on the left is connected to  BCM port 5 of Raspberry pi
TrackSensorRightPin1 =  4    # The first tracking infrared sensor pin on the right is connected to  BCM port 4 of Raspberry pi
TrackSensorRightPin2 =  18   # The second tracking infrared sensor pin on the right is connected to  BCMport 18 of Raspberry pi

servo_pin = 4
buzzer_pin = 10

def init():

	#Set the GPIO port to BCM encoding mode.
	GPIO.setmode(GPIO.BCM)

	# LED init
	GPIO.setup(LED_R, GPIO.OUT)
	GPIO.setup(LED_G, GPIO.OUT)
	GPIO.setup(LED_B, GPIO.OUT)

	# Ignore warning information
	GPIO.setwarnings(False)

	# Motor setup
	GPIO.setup(ENA, GPIO.OUT, initial = GPIO.HIGH)
	GPIO.setup(IN1, GPIO.OUT, initial = GPIO.LOW)
	GPIO.setup(IN2, GPIO.OUT, initial = GPIO.LOW)
	GPIO.setup(ENB, GPIO.OUT, initial = GPIO.HIGH)
	GPIO.setup(IN3, GPIO.OUT, initial = GPIO.LOW)
	GPIO.setup(IN4, GPIO.OUT, initial = GPIO.LOW)

	global pwm_ENA, pwm_ENB
	pwm_ENA = GPIO.PWM(ENA, 2000) # pulse width modulation: 16-os pin 2000Hz-cel
	pwm_ENB = GPIO.PWM(ENB, 2000)

	# Track sensor setup
	GPIO.setup(TrackSensorLeftPin1,		GPIO.IN)
	GPIO.setup(TrackSensorLeftPin2,		GPIO.IN)
	GPIO.setup(TrackSensorRightPin1,	GPIO.IN)
	GPIO.setup(TrackSensorRightPin2,	GPIO.IN)
	
	# buzzer setup
	global pwm_BZZ
	GPIO.setup(buzzer_pin, GPIO.OUT)
	pwm_BZZ = GPIO.PWM(buzzer_pin, 0, 100)

	# servo setup
	global pwm_SER
	GPIO.setup(servo_pin, GPIO.OUT)
	pwm_SER = GPIO.PWM(servo_pin, 0, 100)

	# GPIO.start(buzzer_pin, 100)
	print("Robot loaded.")

def motor(left, right):
	pwm_ENA.start(abs(left))
	pwm_ENB.start(abs(right))
	GPIO.output(IN1, GPIO.HIGH if left > 0 else GPIO.LOW)
	GPIO.output(IN2, GPIO.LOW if left >= 0 else GPIO.HIGH)
	GPIO.output(IN3, GPIO.HIGH if right > 0 else GPIO.LOW)
	GPIO.output(IN4, GPIO.LOW if right >= 0 else GPIO.HIGH)

def led(r, g, b):
	GPIO.output(LED_R, GPIO.HIGH if r else GPIO.LOW)
	GPIO.output(LED_G, GPIO.HIGH if g else GPIO.LOW)
	GPIO.output(LED_B, GPIO.HIGH if b else GPIO.LOW)

def tracksensor():
	ts1 = GPIO.input(TrackSensorLeftPin1)
	ts2 = GPIO.input(TrackSensorLeftPin2)
	ts3 = GPIO.input(TrackSensorRightPin1)
	ts4 = GPIO.input(TrackSensorRightPin2)
	return (ts1, ts2, ts3, ts4)

def sleep():
	pwm_ENA.stop()
	pwm_ENB.stop()
	pwm_BZZ.stop()
	pwm_SER.stop()
	GPIO.cleanup()

def buzzer(pw):
	pwm_BZZ.start(buzzer_pin, pw)

# [-90, 90]
def servo_absolute(degree):
	degree = clamp(degree, -90, 90)
	pwm_SER.start(servo_pin, (int) (15 - (degree / 9)))
