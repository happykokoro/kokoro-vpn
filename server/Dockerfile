FROM rust:1.93-slim AS builder

WORKDIR /build
COPY Cargo.toml Cargo.lock* ./
COPY src/ ./src/
COPY migrations/ ./migrations/

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates wireguard-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /build/target/release/kokoro-vpn-server .
COPY migrations/ ./migrations/

EXPOSE 3000

CMD ["./kokoro-vpn-server"]
