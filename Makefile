docker_build:
	docker build -t nostr-map-project .

docker_run: docker_build
	docker run -p 1234:1234 --rm --init -v $(CURDIR):/app nostr-map-project
