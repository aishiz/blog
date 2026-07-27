#!/usr/bin/env bash
# Пингует IndexNow (Яндекс, Bing и другие участники) со списком всех URL сайта.
# Запускать после паблиша новой статьи или правки существующей.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="ai-shiz.ru"
KEY="0554c466871ba89c699b6e8f34ce63c3"
KEY_LOCATION="https://${HOST}/${KEY}.txt"

urls=()
for f in src/content/blog/*.mdx; do
	slug=$(basename "$f" .mdx)
	urls+=("\"https://${HOST}/blog/${slug}/\"")
done
urls+=("\"https://${HOST}/\"")
for path in "blog" "about" "blog/category/fundament" "blog/category/tools" "blog/category/models" "blog/category/hype"; do
	urls+=("\"https://${HOST}/${path}/\"")
done

url_list=$(IFS=,; echo "${urls[*]}")

curl -sS -X POST "https://api.indexnow.org/indexnow" \
	-H "Content-Type: application/json; charset=utf-8" \
	-d "{\"host\":\"${HOST}\",\"key\":\"${KEY}\",\"keyLocation\":\"${KEY_LOCATION}\",\"urlList\":[${url_list}]}" \
	-w "\nHTTP %{http_code}\n"
