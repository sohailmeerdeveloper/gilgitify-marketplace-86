<?php
require __DIR__ . '/bootstrap.php';

$PRODUCTS_FILE = $DATA_DIR . '/products.json';
$DEFAULT_PRODUCTS_FILE = __DIR__ . '/default-products.json';
$DEFAULT_PRODUCTS = read_json($DEFAULT_PRODUCTS_FILE, []);

if (!file_exists($PRODUCTS_FILE)) {
  write_json($PRODUCTS_FILE, $DEFAULT_PRODUCTS);
}

$products = read_json($PRODUCTS_FILE, $DEFAULT_PRODUCTS);
$method = $_SERVER['REQUEST_METHOD'];
$body = read_body();

function valid_category(string $category): bool {
  return in_array($category, ['general', 'meat', 'vegetable', 'grocery'], true);
}

function clean_product(array $input, ?array $existing = null): ?array {
  $merged = $existing ? array_merge($existing, $input) : $input;

  $id = trim((string)($merged['id'] ?? ''));
  $name = trim((string)($merged['name'] ?? ''));
  $category = trim((string)($merged['category'] ?? ''));

  if ($id === '' || $name === '' || !valid_category($category)) {
    return null;
  }

  $price = $merged['price'] ?? null;
  $stock = $merged['stock'] ?? null;
  if (!is_numeric($price) || !is_numeric($stock)) {
    return null;
  }

  $product = [
    'id' => $id,
    'name' => $name,
    'price' => max(0, (float)$price),
    'category' => $category,
    'image' => trim((string)($merged['image'] ?? '')),
    'description' => trim((string)($merged['description'] ?? '')),
    'unit' => trim((string)($merged['unit'] ?? '')),
    'stock' => max(0, (int)$stock),
  ];

  if (isset($merged['nameUrdu']) && trim((string)$merged['nameUrdu']) !== '') {
    $product['nameUrdu'] = trim((string)$merged['nameUrdu']);
  }

  if ($product['unit'] === '') {
    $product['unit'] = '1 kg';
  }

  return $product;
}

if ($method === 'GET') {
  send(['products' => array_values($products)]);
}

if ($method === 'POST') {
  $product = clean_product($body);
  if (!$product) send(['ok' => false, 'error' => 'invalid'], 400);

  $updated = false;
  foreach ($products as &$p) {
    if (($p['id'] ?? '') === $product['id']) {
      $p = $product;
      $updated = true;
      break;
    }
  }
  unset($p);

  if (!$updated) {
    array_unshift($products, $product);
  }

  write_json($PRODUCTS_FILE, array_values($products));
  send(['ok' => true, 'product' => $product]);
}

if ($method === 'PATCH' || $method === 'PUT') {
  $id = trim((string)($body['id'] ?? ''));
  if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);

  foreach ($products as &$p) {
    if (($p['id'] ?? '') === $id) {
      $next = clean_product($body, $p);
      if (!$next) send(['ok' => false, 'error' => 'invalid'], 400);
      $p = $next;
      write_json($PRODUCTS_FILE, array_values($products));
      send(['ok' => true, 'product' => $next]);
    }
  }
  unset($p);

  send(['ok' => false, 'error' => 'not found'], 404);
}

if ($method === 'DELETE') {
  $id = trim((string)($_GET['id'] ?? ($body['id'] ?? '')));
  if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);

  $next = array_values(array_filter($products, function ($p) use ($id) {
    return ($p['id'] ?? '') !== $id;
  }));

  if (count($next) === count($products)) {
    send(['ok' => false, 'error' => 'not found'], 404);
  }

  write_json($PRODUCTS_FILE, $next);
  send(['ok' => true]);
}

send(['error' => 'method not allowed'], 405);
