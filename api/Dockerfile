FROM python:3.14-slim-bookworm

# Install uv (fast Python package manager)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# Install deps first (cached layer -- rebuilds only if pyproject.toml changes)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project


# Then copy source and install the project itself
COPY . .
RUN uv sync --frozen --no-dev

# Run as non-root user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 5000

CMD ["uv", "run", "gunicorn", "--bind", "0.0.0.0:5000", \
     "--workers", "1", "--access-logfile", "-", "main:app"]