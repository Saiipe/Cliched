"""Game rules shared by services, views and tests."""

MAX_ATTEMPTS = 5
INITIAL_SCORE = 1000
WRONG_GUESS_PENALTY = 100

# Poster pixelation: attempt count -> pixel-block width the image is reduced
# to before being scaled back up (None = original image, served on reveal).
POSTER_PIXEL_BLOCKS: dict[int, int | None] = {0: 4, 1: 8, 2: 14, 3: 24, 4: 48, 5: None}
POSTER_MAX_LEVEL = 5

RUNTIME_TOLERANCE_MIN = 10
TOP_CAST_N = 5
