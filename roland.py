#-*- coding:UTF-8 -*-
#mit hozzunk a táborba?

#1 szigszalag
#2 mérőszalag
#3 csavarhúzó, bitkészlet
#4 pótcsavarok
import wiringpi
import RPi.GPIO as GPIO # Raspberry Pi General Purpose Input/Output
print("Roland betöltve.")
import time # delayekhez kell

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

#Definition of  button
key = 8

#TrackSensorLeftPin1 TrackSensorLeftPin2 TrackSensorRightPin1 TrackSensorRightPin2
#      3                 5                  4                   18
TrackSensorLeftPin1  =  3   #The first tracking infrared sensor pin on the left is connected to  BCM port 3 of Raspberry pi
TrackSensorLeftPin2  =  5   #The second tracking infrared sensor pin on the left is connected to  BCM port 5 of Raspberry pi
TrackSensorRightPin1 =  4    #The first tracking infrared sensor pin on the right is connected to  BCM port 4 of Raspberry pi
TrackSensorRightPin2 =  18   #The second tracking infrared sensor pin on the right is connected to  BCMport 18 of Raspberry pi

#Set the GPIO port to BCM encoding mode.
GPIO.setmode(GPIO.BCM)

print("Pinváltozók beállítva.")

# LED inicializálása
GPIO.setup(LED_R, GPIO.OUT)
GPIO.setup(LED_G, GPIO.OUT)
GPIO.setup(LED_B, GPIO.OUT)

#Ignore warning information
GPIO.setwarnings(False)

#Motor setup
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

#GPIO.setup(key,GPIO.IN)

#Track sensor setup
GPIO.setup(TrackSensorLeftPin1,GPIO.IN)
GPIO.setup(TrackSensorLeftPin2,GPIO.IN)
GPIO.setup(TrackSensorRightPin1,GPIO.IN)
GPIO.setup(TrackSensorRightPin2,GPIO.IN)

# buzzer setup
buzzer_pin = 10
wiringpi.wiringPiSetup()
wiringpi.pinMode(buzzer_pin, 1)
wiringpi.softPwmCreate(buzzer_pin, 0, 100)

def motor(vb,vj):
#vb és vj rendre a bal és jobb oldali sebesség 1 és 100 közötti értéke
    pwm_ENA.start(abs(vb)) 
    pwm_ENB.start(abs(vj))
    GPIO.output(IN1, GPIO.HIGH if vb>0 else GPIO.LOW) 
    GPIO.output(IN2, GPIO.LOW if vb>=0 else GPIO.HIGH) 
    GPIO.output(IN3, GPIO.HIGH if vj>0 else GPIO.LOW) 
    GPIO.output(IN4, GPIO.LOW if vj>=0 else GPIO.HIGH)
            
def led(r,g,b):
    GPIO.output(LED_R, GPIO.HIGH if r==1 else GPIO.LOW)
    GPIO.output(LED_G, GPIO.HIGH if g==1 else GPIO.LOW)
    GPIO.output(LED_B, GPIO.HIGH if b==1 else GPIO.LOW)
    
def tracksensor():
    ts1 = GPIO.input(TrackSensorLeftPin1)
    ts2  = GPIO.input(TrackSensorLeftPin2)
    ts3 = GPIO.input(TrackSensorRightPin1)
    ts4 = GPIO.input(TrackSensorRightPin2)
    return (ts1,ts2,ts3,ts4)
    

def countdown(v):
    for i in range(v):
        print(v-i)
        time.sleep(1)
        
def alszik ():
    pwm_ENA.stop()
    pwm_ENB.stop()
    GPIO.cleanup()

def buzzer(pw, ms):
    wiringpi.softPwmWrite(buzzer_pin, pw)
    wiringpi.delay(ms)
    wiringpi.softPwmWrite(buzzer_pin, 100)



