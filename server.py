from flask_socketio import SocketIO, emit
from flask import Flask
from utils import clamp
import roland

app = Flask(__name__)
socketio = SocketIO(app)

roland.init()

# request for moving around
# BODY: {"left": 100, "right": 100}
@socketio.on('move', namespace='/io')
def move(data):

    # check if keys in request
    if (not 'left' in data or not 'right' in data or not (type(data['left']) is int or float) or not (type(data['right']) is int or float)) :
        print('INCORRECT DATA')
        socketio.emit('error', {"description": "Incorrect request data. Please use format {\"left\":[-100-100], \"right\":[-100-100]}"})

    # convert to integer
    left = int(data['left'])
    right = int(data['right'])

    # clamp value between 0 and 100
    left = clamp(-100, 100, left)
    right = clamp(-100, 100, right)

    # print((left, right))

    # move
    roland.motor(left, right)

# request for LED
# BODY: {"r": 255,"g": 255,"b": 255}
@socketio.on('led', namespace='/io')
def led(data):
    # check if keys in request
    if (not 'r' in data or not 'g' in data or not 'b' in data or type(data['r']) is not int or type(data['g']) is not int or type(data['b']) is not int) :
        socketio.emit('error', { "description": "Incorrect request data. Please use {\"r\":[0-255], \"g\":[0-255], \"b\":[0-255]}" })

    # convert to integer
    R = int(data['r'])
    G = int(data['g'])
    B = int(data['b'])

    # clamp value between 0 and 255
    R = clamp(0, 255, R)
    G = clamp(0, 255, G)
    B = clamp(0, 255, B)

    # set LED color
    roland.led(R, G, B)
    # print((R, G, B))


# STOP request, no body required
@socketio.on('stop', namespace='/io')
def stop():
    roland.sleep()

# get tracksensor info
@socketio.on('tracksensor', namespace='/io')
def sensor():
    res = roland.tracksensor()
    emit('return-tracksensor', { "data": res })
    # print(res)
