FROM denoland/deno:alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY deno.json deno.lock* ./

# Cache dependencies
RUN deno cache main.ts

# Copy source code
COPY main.ts ./

# Use the default non-root user provided by the base image
USER deno

# Create a volume mount point for the files to scan
VOLUME /data

# Set the default command
ENTRYPOINT ["deno", "run", "--allow-read", "main.ts"]
CMD ["/data"] 