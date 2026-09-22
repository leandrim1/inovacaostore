-- Cadastra as bandeiras que o site já mostrava, para elas aparecerem na lista
-- do painel em vez de o lojista abrir a tela vazia e ter que subir uma a uma.
--
-- As artes são arquivos estáticos do próprio projeto (public/formas-pagamento),
-- não uploads: por isso a URL é um caminho fixo e excluir a linha não apaga o
-- arquivo. Trocar qualquer uma por um logo oficial é excluir e enviar o PNG.
--
-- `ON CONFLICT DO NOTHING` com id fixo torna isto idempotente: se a linha já
-- existir (por exemplo, o lojista já tinha cadastrado), nada é sobrescrito.
INSERT INTO "PaymentMethod" ("id", "url", "label", "order") VALUES
  ('pm_visa',       '/formas-pagamento/visa.svg',       'Visa',              0),
  ('pm_mastercard', '/formas-pagamento/mastercard.svg', 'Mastercard',        1),
  ('pm_elo',        '/formas-pagamento/elo.svg',        'Elo',               2),
  ('pm_amex',       '/formas-pagamento/amex.svg',       'American Express',  3),
  ('pm_hipercard',  '/formas-pagamento/hipercard.svg',  'Hipercard',         4),
  ('pm_diners',     '/formas-pagamento/diners.svg',     'Diners Club',       5),
  ('pm_discover',   '/formas-pagamento/discover.svg',   'Discover',          6),
  ('pm_aura',       '/formas-pagamento/aura.svg',       'Aura',              7),
  ('pm_pix',        '/formas-pagamento/pix.svg',        'Pix',               8),
  ('pm_boleto',     '/formas-pagamento/boleto.svg',     'Boleto bancário',   9)
ON CONFLICT ("id") DO NOTHING;
