#!/usr/bin/env bash
# Bateria de testes de segurança contra a API local.
#
# Cada teste tenta EXPLORAR uma falha de verdade e falha se o ataque
# funcionar. Rode com o servidor em pé: `npm run dev:server`.
#
#   bash security-test.sh
set -uo pipefail

API="${API:-http://localhost:4000}"
ORIGIN="${ORIGIN:-http://localhost:5173}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

OK=0; FALHOU=0
ok()    { echo "  OK      $1"; OK=$((OK+1)); }
falhou(){ echo "  FALHOU  $1"; FALHOU=$((FALHOU+1)); }
checa() { [ "$2" = "$3" ] && ok "$1 ($2)" || falhou "$1 — obtido $2, esperado $3"; }
secao() { echo; echo "== $1 =="; }

req() { # req METODO CAMINHO [cookie-jar-ou-vazio] [json] -> imprime status
  local m=$1 p=$2 jar=${3:-} body=${4:-}
  local args=(-s -o "$TMP/out" -w "%{http_code}" -X "$m" -H "Origin: $ORIGIN")
  [ -n "$jar" ] && args+=(-b "$jar")
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" -d "$body")
  curl "${args[@]}" "$API$p"
}

EMAIL="sec-$RANDOM@example.com"

secao "Preparação: cria um cliente comum e faz login de admin"
S=$(curl -s -c "$TMP/cust.txt" -o "$TMP/reg" -w "%{http_code}" -X POST "$API/api/account/register" \
  -H 'Content-Type: application/json' -H "Origin: $ORIGIN" \
  -d "{\"name\":\"Cliente Teste\",\"email\":\"$EMAIL\",\"password\":\"Senha12345\"}")
checa "cadastro de cliente" "$S" "201"
CUST_JWT=$(grep customer_session "$TMP/cust.txt" | awk '{print $7}')

S=$(curl -s -c "$TMP/adm.txt" -o /dev/null -w "%{http_code}" -X POST "$API/api/admin/auth/login" \
  -H 'Content-Type: application/json' -H "Origin: $ORIGIN" \
  -d '{"email":"admin@inovacaostore.com.br","password":"npE2iNaNOKsI"}')
checa "login de admin" "$S" "200"

secao "1. Escalação de privilégio (token de cliente usado como admin)"
S=$(curl -s -o "$TMP/o" -w "%{http_code}" -H "Cookie: admin_session=$CUST_JWT" "$API/api/admin/orders")
checa "cookie de cliente renomeado para admin_session" "$S" "401"
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: admin_session=$CUST_JWT" "$API/api/admin/finance/settings")
checa "idem em /admin/finance/settings" "$S" "401"

secao "2. Acesso sem autenticação a endpoints administrativos"
for rota in orders products categories coupons testimonials settings shipping analytics/summary finance/settings; do
  S=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/admin/$rota")
  checa "GET /api/admin/$rota sem sessão" "$S" "401"
done

secao "3. JWT forjado e algoritmo none"
NONE=$(node -e '
const b=(o)=>Buffer.from(JSON.stringify(o)).toString("base64url");
console.log(b({alg:"none",typ:"JWT"})+"."+b({sub:"x",email:"a@b.c",name:"X",aud:"admin",iss:"inovacaostore"})+".");')
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: admin_session=$NONE" "$API/api/admin/orders")
checa "JWT com alg:none" "$S" "401"
S=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: admin_session=lixo.lixo.lixo" "$API/api/admin/orders")
checa "JWT inválido" "$S" "401"

secao "4. IDOR: ver o pedido de outro cliente"
S=$(req GET /api/account/orders "$TMP/cust.txt")
checa "lista só os próprios pedidos (200)" "$S" "200"
QTD=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$TMP/out','utf8')).items.length)}catch(e){console.log('erro')}")
checa "cliente novo enxerga 0 pedidos" "$QTD" "0"

secao "5. Manipulação de preço / quantidade no pedido"
S=$(req POST /api/orders "$TMP/cust.txt" '{"customer":{"phone":"34999999999"},"address":{"cep":"38700000","street":"R","number":"1","neighborhood":"C","city":"X","state":"MG"},"items":[{"variantId":"x","quantity":1,"price":0.01}],"paymentMethod":"pix"}')
checa "pedido com campo price injetado é rejeitado" "$S" "403"
S=$(req POST /api/orders "" '{"customer":{"phone":"1"},"address":{"cep":"38700000","street":"R","number":"1","neighborhood":"C","city":"X","state":"MG"},"items":[{"variantId":"x","quantity":1}],"paymentMethod":"pix"}')
checa "pedido sem sessão" "$S" "401"
S=$(req POST /api/orders "$TMP/cust.txt" '{"customer":{"phone":"1"},"address":{"cep":"38700000","street":"R","number":"1","neighborhood":"C","city":"X","state":"MG"},"items":[{"variantId":"x","quantity":-5}],"paymentMethod":"pix"}')
checa "quantidade negativa" "$S" "403"

secao "6. CSRF: requisição de outra origem"
S=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/account/logout" -H "Origin: https://site-malicioso.com" -b "$TMP/cust.txt")
checa "POST com Origin externa" "$S" "403"
S=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API/api/admin/products/qualquer" -H "Origin: https://site-malicioso.com" -b "$TMP/adm.txt")
checa "DELETE admin com Origin externa" "$S" "403"

secao "7. Upload malicioso"
printf '<html><script>alert(1)</script></html>' > "$TMP/evil.png"
S=$(curl -s -o "$TMP/o" -w "%{http_code}" -X POST "$API/api/admin/settings/hero-images" -H "Origin: $ORIGIN" \
  -b "$TMP/adm.txt" -F "images=@$TMP/evil.png;type=image/png")
checa "HTML disfarçado de PNG" "$S" "400"
printf '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>' > "$TMP/evil.svg"
S=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/admin/settings/hero-images" -H "Origin: $ORIGIN" \
  -b "$TMP/adm.txt" -F "images=@$TMP/evil.svg;type=image/png")
checa "SVG com script" "$S" "400"

secao "8. Path traversal no servidor de arquivos"
for p in "/uploads/../.env" "/uploads/..%2f..%2f.env" "/uploads/....//.env"; do
  S=$(curl -s -o /dev/null -w "%{http_code}" --path-as-is "$API$p")
  [ "$S" = "200" ] && falhou "traversal $p retornou 200" || ok "traversal bloqueado $p ($S)"
done

secao "9. Headers de segurança"
H="$TMP/headers.txt"; curl -s -D "$H" -o /dev/null "$API/api/categories"
for h in "content-security-policy" "x-content-type-options" "x-frame-options" "referrer-policy" "strict-transport-security"; do
  grep -qi "^$h:" "$H" && ok "header $h presente" || falhou "header $h ausente"
done
grep -qi "^x-powered-by:" "$H" && falhou "X-Powered-By ainda expõe a stack" || ok "X-Powered-By removido"

secao "10. Arquivos enviados são servidos inertes"
HU="$TMP/hu.txt"; curl -s -D "$HU" -o /dev/null "$API/uploads/qualquer.png"
grep -qi "x-content-type-options: nosniff" "$HU" && ok "nosniff em /uploads" || falhou "sem nosniff em /uploads"
grep -qi "content-security-policy: default-src 'none'" "$HU" && ok "CSP restritiva em /uploads" || falhou "sem CSP em /uploads"

secao "11. Vazamento de dados sensíveis na API"
curl -s "$API/api/products" -o "$TMP/prod.json"
for campo in passwordHash costPrice password token secret; do
  grep -q "\"$campo\"" "$TMP/prod.json" && falhou "/api/products expõe $campo" || ok "/api/products não expõe $campo"
done
req GET /api/account/me "$TMP/cust.txt" > /dev/null
grep -q "passwordHash" "$TMP/out" && falhou "/account/me expõe passwordHash" || ok "/account/me não expõe passwordHash"

secao "12. Injeção (SQL / NoSQL) em parâmetros"
for payload in "' OR '1'='1" "'; DROP TABLE \"Product\"; --" '{"$ne":null}' "../../etc/passwd"; do
  S=$(curl -s -o /dev/null -w "%{http_code}" --get --data-urlencode "q=$payload" "$API/api/products")
  [ "$S" = "500" ] && falhou "payload causou erro 500: $payload" || ok "payload tratado ($S): ${payload:0:24}"
done
S=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/products/'%20OR%201=1--")
checa "slug com injeção" "$S" "404"

secao "13. Payload gigante e JSON malformado"
node -e 'process.stdout.write(JSON.stringify({name:"x".repeat(2_000_000)}))' > "$TMP/big.json"
S=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/account/login" -H 'Content-Type: application/json' -H "Origin: $ORIGIN" --data-binary "@$TMP/big.json")
checa "corpo de 2MB rejeitado" "$S" "413"
S=$(curl -s -o "$TMP/o" -w "%{http_code}" -X POST "$API/api/account/login" -H 'Content-Type: application/json' -H "Origin: $ORIGIN" -d '{"quebrado":')
checa "JSON malformado" "$S" "400"
grep -qiE "SyntaxError|at JSON|/home/|node_modules" "$TMP/o" && falhou "resposta vaza detalhe interno" || ok "erro sem stack trace"

secao "14. Enumeração de usuários e mensagens de erro"
curl -s -o "$TMP/l1" -X POST "$API/api/account/login" -H 'Content-Type: application/json' -H "Origin: $ORIGIN" -d "{\"email\":\"$EMAIL\",\"password\":\"errada\"}"
curl -s -o "$TMP/l2" -X POST "$API/api/account/login" -H 'Content-Type: application/json' -H "Origin: $ORIGIN" -d '{"email":"naoexiste@example.com","password":"errada"}'
[ "$(cat "$TMP/l1")" = "$(cat "$TMP/l2")" ] && ok "login: mesma resposta para e-mail existente e inexistente" || falhou "login revela se o e-mail existe"
curl -s -o "$TMP/f1" -X POST "$API/api/account/forgot-password" -H 'Content-Type: application/json' -H "Origin: $ORIGIN" -d "{\"email\":\"$EMAIL\"}"
curl -s -o "$TMP/f2" -X POST "$API/api/account/forgot-password" -H 'Content-Type: application/json' -H "Origin: $ORIGIN" -d '{"email":"naoexiste@example.com"}'
[ "$(cat "$TMP/f1")" = "$(cat "$TMP/f2")" ] && ok "esqueci-senha: resposta genérica" || falhou "esqueci-senha revela se o e-mail existe"

secao "15. Métodos HTTP inesperados"
for m in TRACE TRACK; do
  S=$(curl -s -o /dev/null -w "%{http_code}" -X $m "$API/api/products")
  [ "$S" = "200" ] && falhou "$m permitido" || ok "$m não permitido ($S)"
done

secao "16. Força bruta no login"
# Mira uma conta INEXISTENTE de propósito: o limite é por IP+conta alvo, então
# martelar aqui não pode travar o login do admin de verdade. Se travasse, esta
# própria suíte não rodaria duas vezes seguidas — e foi o que aconteceu antes
# de o alvo ser separado.
BLOQUEOU=nao
for i in $(seq 1 14); do
  S=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/admin/auth/login" -H 'Content-Type: application/json' -H "Origin: $ORIGIN" \
    -d '{"email":"alvo-forca-bruta@example.com","password":"tentativa-errada"}')
  [ "$S" = "429" ] && { BLOQUEOU=sim; echo "  (bloqueado na tentativa $i)"; break; }
done
checa "login administrativo bloqueia força bruta" "$BLOQUEOU" "sim"
# Prova de que o bloqueio é por conta: o admin real continua conseguindo entrar.
S=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/admin/auth/login" -H 'Content-Type: application/json' -H "Origin: $ORIGIN" \
  -d '{"email":"admin@inovacaostore.com.br","password":"npE2iNaNOKsI"}')
checa "bloqueio não atinge outra conta (limite por IP+conta)" "$S" "200"

echo
echo "================================"
echo "  Passaram: $OK   Falharam: $FALHOU"
echo "================================"
[ "$FALHOU" -eq 0 ]
