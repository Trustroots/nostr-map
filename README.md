# nostr-map

Read and leave **nostr notes on a map**.

This is running at [notes.trustroots.org](https://notes.trustroots.org/). And it is part of our effort to [nostrify trustroots](https://github.com/Trustroots/nostroots).


## Getting started

- Install node and yarn
- `yarn`
- `yarn start`
- Open http://localhost:1234

It seems that newer node versions [don't work](https://github.com/Trustroots/nostr-map/issues/21) don't work. You may have to run this to use node v18:
- `nvm install`
- `nvm use`

You might need `corepack` to get yarn v4. [please update/clarify this]

## Ideas
somewhat concrete:
- [filters](https://github.com/Trustroots/nostr-map/issues/13)
- [chat](https://github.com/Trustroots/nostr-map/issues/14)

vague-ish:
- rideshare related tags
- update location with regular interval
- hashtags, e.g. for circles or events, #hg24 for hitchgathering 2024?
