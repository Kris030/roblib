from flask_socketio import SocketIO, emit
from flask import Flask
from utils import clamp
import roland

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

roland.init()

# request for moving around
# BODY: {'left': 100, 'right': 100}
@socketio.on('move', namespace='/io')
def move(data):

	# check if keys in request
	if (not 'left' in data or not 'right' in data or not (type(data['left']) is int or float) or not (type(data['right']) is int or float)) :
		# print('INCORRECT DATA')
		socketio.emit('error', {'description': 'Incorrect request data. Please use format {\'left\': [-100-100], \'right\': [-100-100]}'})
		return

	# convert to integer
	left = int(data['left'])
	right = int(data['right'])

	# clamp value between 0 and 100
	left = clamp(left, -100, 100)
	right = clamp(right, -100, 100)

	# print((left, right))

	# move
	roland.motor(left, right)

# request for LED
# BODY: {'r': true|false,'g': true|false,'b': true|false}
@socketio.on('led', namespace='/io')
def led(data):
	# check if keys in request
	if (not 'r' in data or not 'g' in data or not 'b' in data or type(data['r']) is not bool or type(data['g']) is not bool or type(data['b']) is not bool) :
		socketio.emit('error', { 'description': 'Incorrect request data. Please use {\'r\': true|false, \'g\': true|false, \'b\': true|false}' })
		return

	# set LED color
	roland.led(data['r'], data['g'], data['b'])

# STOP request, no body required
@socketio.on('stop', namespace='/io')
def stop():
	roland.sleep()

# get tracksensor info
@socketio.on('tracksensor', namespace='/io')
def sensor():
	res = roland.tracksensor()
	emit('return-tracksensor', { 'data': res })
	# print(res)

# set servo angle
@socketio.on('servo', namespace='/io')
def servo(data):

	if not 'degree' in data or type(data['degree']) is not int:
		socketio.emit('error', { 'description': 'Incorrect request data. Please use {\'degree\': [-90-90]}' })
		return
	
	roland.servo_absolute(data['degree'])

@socketio.on('buzzer', namespace='/io')
def buzzer(data):

	if not 'pw' in data or type(data['pw']) is not int:
		socketio.emit('error', { 'description': 'Incorrect request data. Please use {\'pw\': [0-100]}' })
		return

	roland.buzzer(data['pw'])
