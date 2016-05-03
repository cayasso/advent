BABEL = ./node_modules/.bin/babel

all: lib

lib: src
	$(BABEL) src -d lib

clean:
	rm -rf lib/

test:
	@./node_modules/.bin/mocha \
		--reporter spec \
		--require should \
		--require babel-core/register \
		--recursive \
		test

.PHONY: test clean lib
