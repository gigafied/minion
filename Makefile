OVERRIDING=default

SRC_DIR = src
TEST_DIR = test
BUILD_DIR = build

PREFIX = .
BIN_DIR = ${PREFIX}/bin

COMPILER = uglifyjs -nc --unsafe

HEADER = ${SRC_DIR}/f0xy.header.js

FILES = ${HEADER}\
	${SRC_DIR}/f0xy.main.js\
	${SRC_DIR}/f0xy.baseclass.js\
	${SRC_DIR}/f0xy.class.js\
	${SRC_DIR}/f0xy.static.js\
	${SRC_DIR}/f0xy.singleton.js\
	${SRC_DIR}/f0xy.notifications.js\

F0XY = ${BIN_DIR}/f0xy.js
F0XY_MIN = ${BIN_DIR}/f0xy.min.js

VER = $(shell cat version.txt)

DATE=$(shell git log -1 --pretty=format:%ad)

BRANCH=$(git symbolic-ref -q HEAD)
BRANCH=${branch_name##refs/heads/}
BRANCH=${branch_name:-HEAD}

m=0
b=0

all: update_submodules core

core: min docs
	@@echo "f0xy build complete."

f0xy: 
	@@echo "Building" ${F0XY}
	@@echo "Version:" ${VER}

	@@mkdir -p ${BIN_DIR}

	@@cat ${FILES} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		sed 's/@VERSION/'"${VER}"'/' > ${F0XY};

	@@cat ${FILES} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		sed 's/@VERSION/'"${VER}"'/' > ${PREFIX}/utils/f0xy.js;

min: f0xy

	@@${COMPILER} ${F0XY} > ${F0XY_MIN}

	@@cat ${HEADER} ${F0XY_MIN} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		sed 's/@VERSION/'"${VER}"'/' > bin/tmp

	@@mv bin/tmp ${F0XY_MIN}

docs: f0xy

	lib/node-jsdoc-toolkit/app/run.js -c=lib/jsdoc.conf

size: f0xy min
	@@gzip -c ${F0XY_MIN} > ${F0XY_MIN}.gz; \
	wc -c ${F0XY} ${F0XY_MIN} ${F0XY_MIN}.gz;
	@@rm ${F0XY_MIN}.gz; \

push_docs: docs
	cd gh-pages; git add .; \
	git commit -am "updated docs"; \
	git push origin gh-pages

# change pointers for submodules and update them to what is specified in jQuery
# --merge  doesn't work when doing an initial clone, thus test if we have non-existing
#  submodules, then do an real update
update_submodules:
	@@if [ -d .git ]; then \
		if git submodule status | grep -q -E '^-'; then \
			git submodule update --init --recursive; \
		else \
			git submodule update --init --recursive --merge; \
		fi; \
	fi;

# update the submodules to the latest at the most logical branch
pull_submodules:
	@@git submodule foreach "git pull \$$(git config remote.origin.url)"
	@@git submodule summary
