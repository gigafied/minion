# TODO : Move all this make stuff into make.js

OVERRIDING=default

SRC_DIR = src
TEST_DIR = test

PREFIX = .
DIST_DIR = ${PREFIX}/dist

COMPILER = ./node_modules/uglify-js/bin/uglifyjs -nc --unsafe

HEADER = ${SRC_DIR}/minion.header.js

FILES = ${HEADER}\
	${SRC_DIR}/minion.main.js\
	${SRC_DIR}/minion.baseclass.js\
	${SRC_DIR}/minion.class.js\
	${SRC_DIR}/minion.singleton.js\
	${SRC_DIR}/minion.static.js\
	${SRC_DIR}/minion.notifications.js\

VER = $(shell cat version.txt)

minion = ${DIST_DIR}/minion-${VER}.js
minion_MIN = ${DIST_DIR}/minion-${VER}.min.js
minion_LATEST = ${DIST_DIR}/minion-latest.js
minion_LATEST_MIN = ${DIST_DIR}/minion-latest.min.js


DATE=$(shell git log -1 --pretty=format:%ad)

BRANCH=$(git symbolic-ref -q HEAD)
BRANCH=${branch_name##refs/heads/}
BRANCH=${branch_name:-HEAD}

m=0
b=0

all: core node

core: min docs
	@@echo "minion build complete."

minion: 
	@@echo "Building" ${minion}
	@@echo "Version:" ${VER}

	@@mkdir -p ${DIST_DIR}

	@@cat ${FILES} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		sed 's/@VERSION/'"${VER}"'/' > ${minion};

	@@cp ${minion} ${minion_LATEST}
	@@cp ${minion} ${PREFIX}/bin/minion.js;

min: minion
	@@${COMPILER} ${minion} > ${minion_MIN}

	@@cat ${HEADER} ${minion_MIN} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		sed 's/@VERSION/'"${VER}"'/' > bin/tmp

	@@mv bin/tmp ${minion_MIN}
	@@cp ${minion_MIN} ${minion_LATEST_MIN}

docs: minion
	node_modules/jsdoc-toolkit/app/run.js -c=${SRC_DIR}/jsdoc-conf.json

size: minion min
	@@gzip -c ${minion_MIN} > ${minion_MIN}.gz; \
	wc -c ${minion} ${minion_MIN} ${minion_MIN}.gz;
	@@rm ${minion_MIN}.gz; \

push_docs: docs
	cd gh-pages; git add .; \
	git commit -am "updated docs"; \
	git push origin gh-pages

node:
	@@node make.js