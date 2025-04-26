# prompt-booster

```bash
docker pull ghcr.io/hexart/prompt-booster:latest \
&& docker rm -f prompt-booster 2>/dev/null || true \
&& docker run -d \
    --name prompt-booster \
    --restart always \
    -p 3000:3000 \
    ghcr.io/hexart/prompt-booster:latest
```