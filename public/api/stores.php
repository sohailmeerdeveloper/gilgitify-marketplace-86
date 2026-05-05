<?php
require __DIR__ . '/bootstrap.php';

$STORES_FILE         = $DATA_DIR . '/stores.json';
$STORE_PRODUCTS_FILE = $DATA_DIR . '/store_products.json';

$stores         = read_json($STORES_FILE, []);
$storeProducts  = read_json($STORE_PRODUCTS_FILE, []);

$method = $_SERVER['REQUEST_METHOD'];
$body   = read_body();
$action = $_GET['action'] ?? '';

function strip_secret(array $store): array {
  unset($store['passwordHash']);
  return $store;
}

if ($method === 'GET') {
  $slug = trim((string)($_GET['slug'] ?? ''));
  $all  = !empty($_GET['all']);

  if ($slug !== '') {
    foreach ($stores as $s) {
      if (($s['slug'] ?? '') === $slug) send(['store' => strip_secret($s)]);
    }
    send(['store' => null], 404);
  }

  $list = $all
    ? $stores
    : array_filter($stores, function ($s) { return ($s['status'] ?? '') === 'approved'; });

  send(['stores' => array_values(array_map('strip_secret', $list))]);
}

if ($method === 'POST') {

  // Vendor login: returns { ok, store } including only the storeId/email/slug.
  if ($action === 'login') {
    $email    = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');
    if ($email === '' || $password === '') send(['ok' => false], 400);

    foreach ($stores as $s) {
      if (strtolower($s['ownerEmail'] ?? '') !== $email) continue;
      if (hash('sha256', $password) !== ($s['passwordHash'] ?? '')) {
        send(['ok' => false, 'error' => 'wrong password']);
      }
      send([
        'ok' => true,
        'store' => strip_secret($s),
        'sessionToken' => $s['id'], // simple token: the store id
      ]);
    }
    send(['ok' => false, 'error' => 'no store with that email']);
  }

  // Change password (vendor self-service from dashboard).
  if ($action === 'changePassword') {
    $id          = trim((string)($body['storeId'] ?? ''));
    $currentPwd  = (string)($body['currentPassword'] ?? '');
    $newPwd      = (string)($body['newPassword'] ?? '');
    if ($id === '' || strlen($newPwd) < 4) send(['ok' => false], 400);

    $changed = false;
    foreach ($stores as &$s) {
      if (($s['id'] ?? '') !== $id) continue;
      if (hash('sha256', $currentPwd) !== ($s['passwordHash'] ?? '')) {
        send(['ok' => false, 'error' => 'wrong password']);
      }
      $s['passwordHash'] = hash('sha256', $newPwd);
      $changed = true;
      break;
    }
    unset($s);
    if (!$changed) send(['ok' => false], 404);
    write_json($STORES_FILE, $stores);
    send(['ok' => true]);
  }

  // Update store fields the vendor controls (name, description, logo).
  if ($action === 'updateProfile') {
    $id    = trim((string)($body['storeId'] ?? ''));
    if ($id === '') send(['ok' => false], 400);

    $found = false;
    foreach ($stores as &$s) {
      if (($s['id'] ?? '') !== $id) continue;
      if (array_key_exists('name', $body))        $s['name']        = trim((string)$body['name']);
      if (array_key_exists('description', $body)) $s['description'] = trim((string)$body['description']);
      if (array_key_exists('logo', $body))        $s['logo']        = $body['logo'] ?: null;
      $found = true;
      break;
    }
    unset($s);
    if (!$found) send(['ok' => false], 404);
    write_json($STORES_FILE, $stores);
    send(['ok' => true]);
  }

  // Admin: change status (suspend / reactivate).
  if ($action === 'setStatus') {
    $id     = trim((string)($body['id'] ?? ''));
    $status = trim((string)($body['status'] ?? ''));
    if ($id === '' || !in_array($status, ['approved', 'suspended'], true)) send(['ok' => false], 400);
    $found = false;
    foreach ($stores as &$s) {
      if (($s['id'] ?? '') !== $id) continue;
      $s['status'] = $status;
      $found = true;
      break;
    }
    unset($s);
    if (!$found) send(['ok' => false], 404);
    write_json($STORES_FILE, $stores);
    send(['ok' => true]);
  }

  // Admin: mark premium plan paid (cash).
  if ($action === 'markPaid') {
    $id     = trim((string)($body['id'] ?? ''));
    $months = (int)($body['months'] ?? 0);
    if ($id === '' || $months <= 0) send(['ok' => false], 400);
    $found = false;
    foreach ($stores as &$s) {
      if (($s['id'] ?? '') !== $id) continue;
      $now = time();
      $existing = isset($s['premiumExpiresAt']) ? strtotime((string)$s['premiumExpiresAt']) : false;
      $base = ($existing && $existing > $now) ? $existing : $now;
      $s['premiumPaidAt']    = gmdate('c');
      $s['premiumExpiresAt'] = gmdate('c', strtotime('+' . $months . ' months', $base));
      $s['status']           = 'approved';
      $found = true;
      break;
    }
    unset($s);
    if (!$found) send(['ok' => false], 404);
    write_json($STORES_FILE, $stores);
    send(['ok' => true]);
  }

  send(['error' => 'unknown action'], 400);
}

if ($method === 'DELETE') {
  $id = trim((string)($_GET['id'] ?? ($body['id'] ?? '')));
  if ($id === '') send(['ok' => false], 400);
  $next = array_values(array_filter($stores, function ($s) use ($id) {
    return ($s['id'] ?? '') !== $id;
  }));
  if (count($next) === count($stores)) send(['ok' => false], 404);
  write_json($STORES_FILE, $next);

  // Cascade-delete this store's products.
  $remaining = array_values(array_filter($storeProducts, function ($p) use ($id) {
    return ($p['storeId'] ?? '') !== $id;
  }));
  write_json($STORE_PRODUCTS_FILE, $remaining);
  send(['ok' => true]);
}

send(['error' => 'method not allowed'], 405);
