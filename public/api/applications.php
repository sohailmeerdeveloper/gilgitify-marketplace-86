<?php
require __DIR__ . '/bootstrap.php';

$APPLICATIONS_FILE = $DATA_DIR . '/applications.json';
$STORES_FILE       = $DATA_DIR . '/stores.json';

$applications = read_json($APPLICATIONS_FILE, []);
$stores       = read_json($STORES_FILE, []);

$method = $_SERVER['REQUEST_METHOD'];
$body   = read_body();
$action = $_GET['action'] ?? '';

function gen_id(string $prefix): string {
  return $prefix . '_' . bin2hex(random_bytes(6));
}

function slugify(string $s): string {
  $s = strtolower(trim($s));
  $s = preg_replace('/[^a-z0-9]+/', '-', $s);
  $s = trim($s, '-');
  if ($s === '') $s = 'store';
  return substr($s, 0, 60);
}

function unique_slug(array $stores, string $base): string {
  $root = slugify($base);
  $taken = array_map(function ($s) { return $s['slug'] ?? ''; }, $stores);
  if (!in_array($root, $taken, true)) return $root;
  for ($i = 2; $i < 100; $i++) {
    $cand = $root . '-' . $i;
    if (!in_array($cand, $taken, true)) return $cand;
  }
  return $root . '-' . substr(bin2hex(random_bytes(3)), 0, 4);
}

// GET — list applications (admin)
if ($method === 'GET') {
  // Strip password hashes before returning.
  $safe = array_map(function ($a) {
    unset($a['passwordHash']);
    return $a;
  }, $applications);
  send(['applications' => array_values($safe)]);
}

// POST — submit a new application OR approve/reject (action in querystring).
if ($method === 'POST') {

  if ($action === 'approve') {
    $id = (string)($body['id'] ?? '');
    if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);

    $app = null;
    foreach ($applications as &$a) {
      if (($a['id'] ?? '') === $id) {
        $a['status'] = 'approved';
        $a['reviewedAt'] = gmdate('c');
        $app = $a;
        break;
      }
    }
    unset($a);
    if (!$app) send(['ok' => false, 'error' => 'not found'], 404);

    // Create the store. Carry over the password hash so the vendor can log in.
    $slug = unique_slug($stores, $app['shopName']);
    $store = [
      'id'             => gen_id('store'),
      'slug'           => $slug,
      'name'           => $app['shopName'],
      'description'    => $app['shopDescription'] ?? '',
      'logo'           => null,
      'category'       => $app['shopCategory'] ?? null,
      'ownerName'      => $app['fullName'],
      'ownerEmail'     => strtolower($app['email']),
      'ownerPhone'     => $app['phone'],
      'passwordHash'   => $app['passwordHash'],
      'status'         => 'approved',
      'premiumPaidAt'  => null,
      'premiumExpiresAt' => null,
      'createdAt'      => gmdate('c'),
    ];
    array_unshift($stores, $store);

    write_json($APPLICATIONS_FILE, $applications);
    write_json($STORES_FILE, $stores);

    $publicStore = $store;
    unset($publicStore['passwordHash']);
    send(['ok' => true, 'store' => $publicStore]);
  }

  if ($action === 'reject') {
    $id   = (string)($body['id'] ?? '');
    $note = trim((string)($body['note'] ?? ''));
    if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);
    $found = false;
    foreach ($applications as &$a) {
      if (($a['id'] ?? '') === $id) {
        $a['status']     = 'rejected';
        $a['adminNote']  = $note ?: null;
        $a['reviewedAt'] = gmdate('c');
        $found = true;
        break;
      }
    }
    unset($a);
    if (!$found) send(['ok' => false, 'error' => 'not found'], 404);
    write_json($APPLICATIONS_FILE, $applications);
    send(['ok' => true]);
  }

  // Plain submission.
  $fullName     = trim((string)($body['fullName'] ?? ''));
  $phone        = trim((string)($body['phone'] ?? ''));
  $email        = strtolower(trim((string)($body['email'] ?? '')));
  $password     = (string)($body['password'] ?? '');
  $shopName     = trim((string)($body['shopName'] ?? ''));
  $shopDesc     = trim((string)($body['shopDescription'] ?? ''));
  $shopCategory = trim((string)($body['shopCategory'] ?? ''));

  if ($fullName === '' || $phone === '' || $email === '' || $shopName === '' || $shopDesc === '' || strlen($password) < 4) {
    send(['ok' => false, 'error' => 'missing or invalid fields'], 400);
  }

  // Block re-applying with an email that already has an approved store.
  foreach ($stores as $s) {
    if (strtolower($s['ownerEmail'] ?? '') === $email) {
      send(['ok' => false, 'error' => 'A store with this email already exists. Log in at /vendor.'], 409);
    }
  }
  // Allow only one pending application per email at a time.
  foreach ($applications as $a) {
    if (strtolower($a['email'] ?? '') === $email && ($a['status'] ?? '') === 'pending') {
      send(['ok' => false, 'error' => 'An application with this email is already pending review.'], 409);
    }
  }

  $app = [
    'id'              => gen_id('app'),
    'fullName'        => $fullName,
    'phone'           => $phone,
    'email'           => $email,
    'passwordHash'    => hash('sha256', $password),
    'shopName'        => $shopName,
    'shopDescription' => $shopDesc,
    'shopCategory'    => $shopCategory ?: null,
    'status'          => 'pending',
    'adminNote'       => null,
    'createdAt'       => gmdate('c'),
    'reviewedAt'      => null,
  ];
  array_unshift($applications, $app);
  write_json($APPLICATIONS_FILE, $applications);
  $publicApp = $app;
  unset($publicApp['passwordHash']);
  send(['ok' => true, 'application' => $publicApp]);
}

if ($method === 'DELETE') {
  $id = trim((string)($_GET['id'] ?? ($body['id'] ?? '')));
  if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);
  $next = array_values(array_filter($applications, function ($a) use ($id) {
    return ($a['id'] ?? '') !== $id;
  }));
  if (count($next) === count($applications)) send(['ok' => false, 'error' => 'not found'], 404);
  write_json($APPLICATIONS_FILE, $next);
  send(['ok' => true]);
}

send(['error' => 'method not allowed'], 405);
