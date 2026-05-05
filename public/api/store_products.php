<?php
require __DIR__ . '/bootstrap.php';

$STORE_PRODUCTS_FILE = $DATA_DIR . '/store_products.json';
$products = read_json($STORE_PRODUCTS_FILE, []);

$method = $_SERVER['REQUEST_METHOD'];
$body   = read_body();

function gen_id(string $prefix): string {
  return $prefix . '_' . bin2hex(random_bytes(6));
}

function clean_sp(array $input, ?array $existing = null): ?array {
  $merged = $existing ? array_merge($existing, $input) : $input;
  $name    = trim((string)($merged['name'] ?? ''));
  $storeId = trim((string)($merged['storeId'] ?? ''));
  if ($name === '' || $storeId === '') return null;
  $price = is_numeric($merged['price'] ?? null) ? max(0, (float)$merged['price']) : 0;
  $stock = is_numeric($merged['stock'] ?? null) ? max(0, (int)$merged['stock']) : 0;
  return [
    'id'          => $merged['id'] ?? gen_id('sp'),
    'storeId'     => $storeId,
    'name'        => $name,
    'price'       => $price,
    'category'    => trim((string)($merged['category'] ?? 'general')) ?: 'general',
    'image'       => trim((string)($merged['image'] ?? '')),
    'description' => trim((string)($merged['description'] ?? '')),
    'unit'        => trim((string)($merged['unit'] ?? '1 piece')) ?: '1 piece',
    'stock'       => $stock,
    'createdAt'   => $merged['createdAt'] ?? gmdate('c'),
  ];
}

if ($method === 'GET') {
  $storeId = trim((string)($_GET['storeId'] ?? ''));
  if ($storeId !== '') {
    $list = array_values(array_filter($products, function ($p) use ($storeId) {
      return ($p['storeId'] ?? '') === $storeId;
    }));
    send(['products' => $list]);
  }
  send(['products' => array_values($products)]);
}

if ($method === 'POST') {
  $next = clean_sp($body);
  if (!$next) send(['ok' => false, 'error' => 'invalid'], 400);
  array_unshift($products, $next);
  write_json($STORE_PRODUCTS_FILE, $products);
  send(['ok' => true, 'product' => $next]);
}

if ($method === 'PATCH' || $method === 'PUT') {
  $id = trim((string)($body['id'] ?? ''));
  if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);
  foreach ($products as &$p) {
    if (($p['id'] ?? '') === $id) {
      $next = clean_sp($body, $p);
      if (!$next) send(['ok' => false, 'error' => 'invalid'], 400);
      $p = $next;
      write_json($STORE_PRODUCTS_FILE, array_values($products));
      send(['ok' => true, 'product' => $next]);
    }
  }
  unset($p);
  send(['ok' => false, 'error' => 'not found'], 404);
}

if ($method === 'DELETE') {
  $id = trim((string)($_GET['id'] ?? ($body['id'] ?? '')));
  if ($id === '') send(['ok' => false], 400);
  $next = array_values(array_filter($products, function ($p) use ($id) {
    return ($p['id'] ?? '') !== $id;
  }));
  if (count($next) === count($products)) send(['ok' => false, 'error' => 'not found'], 404);
  write_json($STORE_PRODUCTS_FILE, $next);
  send(['ok' => true]);
}

send(['error' => 'method not allowed'], 405);
