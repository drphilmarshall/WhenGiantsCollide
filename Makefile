NODE=/opt/local/bin/node --trace_exception
UGLIFYJS=uglifyjs -m -c -o
MODE=FAST_DEBUG
#MODE=DEBUG
CPP=/usr/local/bin/cpp -nostdinc -undef -D$(MODE) -P -std=gnu99 -C -imacros jsp/defines.h -imacros jsp/math.h
JSP=jsp/*.js

all: $(JSP)
	for jsp in $(JSP); do \
		CPP="$(CPP)" node macro_ws.js $$jsp js/`basename $$jsp` ; \
  done

clean:
	rm -f js/*.js
