SRC_DIR = src
TEST_DIR = test
BUILD_DIR = build

PREFIX = .
BIN_DIR = ${PREFIX}/bin

COMPILER = uglifyjs -nc

HEADER = ${SRC_DIR}/f0xy.header.js

FILES = ${HEADER}\
	${SRC_DIR}/f0xy.main.js\
	${SRC_DIR}/f0xy.baseclass.js\
	${SRC_DIR}/f0xy.class.js\

F0XY = ${BIN_DIR}/f0xy.js
F0XY_MIN = ${BIN_DIR}/f0xy.min.js

VER = $(shell cat version.txt)

DATE=$(shell git log -1 --pretty=format:%ad)

all: core

core: min docs
	@@echo "f0xy build complete."

f0xy: 
	@@echo "Building" ${F0XY}
	@@echo "Version:" ${VER}

	@@mkdir -p ${BIN_DIR}

	@@cat ${FILES} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		sed 's/@VERSION/'"${VER}"'/' > ${F0XY};

min: f0xy

	@@${COMPILER} ${F0XY} > ${F0XY_MIN}

	@@cat ${HEADER} ${F0XY_MIN} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		sed 's/@VERSION/'"${VER}"'/' > bin/tmp

	@@mv bin/tmp ${F0XY_MIN}

docs: f0xy

	lib/node-jsdoc-toolkit/app/run.js -c=lib/jsdoc.conf
