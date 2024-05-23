docker_build:
	docker build -t nostr-map-project .

docker_run:
	docker run -it -p 1234:1234 --rm --init -v $(CURDIR):/app nostr-map-project

new: docker_build docker_run
