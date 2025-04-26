# prompt-booster

```bash
docker pull ghcr.io/hexart/prompt-booster:latest \
&& docker rm -f prompt-booster 2>/dev/null || true \
&& docker run -d \
    --name prompt-booster \
    --restart always \
    -p 8080:80 \
    ghcr.io/hexart/prompt-booster:latest
```