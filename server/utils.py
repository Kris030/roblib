
def clamp(val, _min, _max):
	if val < _min:
		return _min
	if val > _max:
		return _max
	return val
