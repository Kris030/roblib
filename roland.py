import RPi.GPIO as GPIO
print("Robot loaded.")

# Motors
IN1 = 20 # left forward
IN2 = 21 # left backward
IN3 = 19 # right forward
IN4 = 26 # right backward
ENA = 16 # left speed (pwm)
ENB = 13 # right speed (pwm)

# RGB module pin
LED_R = 22
LED_G = 27
LED_B = 24

#TrackSensorLeftPin1 TrackSensorLeftPin2 TrackSensorRightPin1 TrackSensorRightPin2
#      3                 5                  4                   18
TrackSensorLeftPin1  =  3   #The first tracking infrared sensor pin on the left is connected to  BCM port 3 of Raspberry pi
TrackSensorLeftPin2  =  5   #The second tracking infrared sensor pin on the left is connected to  BCM port 5 of Raspberry pi
TrackSensorRightPin1 =  4    #The first tracking infrared sensor pin on the right is connected to  BCM port 4 of Raspberry pi
TrackSensorRightPin2 =  18   #The second tracking infrared sensor pin on the right is connected to  BCMport 18 of Raspberry pi

#Set the GPIO port to BCM encoding mode.
GPIO.setmode(GPIO.BCM)

# LED init
GPIO.setup(LED_R, GPIO.OUT)
GPIO.setup(LED_G, GPIO.OUT)
GPIO.setup(LED_B, GPIO.OUT)

# Ignore warning information
GPIO.setwarnings(False)

# Motor setup
GPIO.setup(ENA,GPIO.OUT,initial=GPIO.HIGH)
GPIO.setup(IN1,GPIO.OUT,initial=GPIO.LOW)
GPIO.setup(IN2,GPIO.OUT,initial=GPIO.LOW)
GPIO.setup(ENB,GPIO.OUT,initial=GPIO.HIGH)
GPIO.setup(IN3,GPIO.OUT,initial=GPIO.LOW)
GPIO.setup(IN4,GPIO.OUT,initial=GPIO.LOW)

global pwm_ENA
global pwm_ENB
pwm_ENA = GPIO.PWM(ENA, 2000) # pulse width modulation: 16-os pin 2000Hz-cel
pwm_ENB = GPIO.PWM(ENB, 2000)

# Track sensor setup
GPIO.setup(TrackSensorLeftPin1,GPIO.IN)
GPIO.setup(TrackSensorLeftPin2,GPIO.IN)
GPIO.setup(TrackSensorRightPin1,GPIO.IN)
GPIO.setup(TrackSensorRightPin2,GPIO.IN)

def motor(vb,vj):
    pwm_ENA.start(abs(vb))
    pwm_ENB.start(abs(vj))
    GPIO.output(IN1, GPIO.HIGH if vb > 0 else GPIO.LOW)
    GPIO.output(IN2, GPIO.LOW if vb >= 0 else GPIO.HIGH)
    GPIO.output(IN3, GPIO.HIGH if vj > 0 else GPIO.LOW)
    GPIO.output(IN4, GPIO.LOW if vj >= 0 else GPIO.HIGH)

def led(r,g,b):
    GPIO.output(LED_R, GPIO.HIGH if r == 1 else GPIO.LOW)
    GPIO.output(LED_G, GPIO.HIGH if g == 1 else GPIO.LOW)
    GPIO.output(LED_B, GPIO.HIGH if b == 1 else GPIO.LOW)

def tracksensor():
    ts1 = GPIO.input(TrackSensorLeftPin1)
    ts2 = GPIO.input(TrackSensorLeftPin2)
    ts3 = GPIO.input(TrackSensorRightPin1)
    ts4 = GPIO.input(TrackSensorRightPin2)
    return (ts1, ts2, ts3, ts4)

def sleep():
    pwm_ENA.stop()
    pwm_ENB.stop()
    GPIO.cleanup()