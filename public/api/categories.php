<?php
require __DIR__ . '/bootstrap.php';

$CATS_FILE = $DATA_DIR . '/categories.json';

$DEFAULTS = [
  ['slug'=>'general',     'label'=>'General Store',  'description'=>'Daily essentials and household items', 'image'=>'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80', 'sortOrder'=>10],
  ['slug'=>'meat',        'label'=>'Meat Shop',      'description'=>'Fresh halal meat, chicken & fish',     'image'=>'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80', 'sortOrder'=>20],
  ['slug'=>'vegetable',   'label'=>'Vegetable Shop', 'description'=>'Farm-fresh vegetables & fruits',       'image'=>'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80', 'sortOrder'=>30],
  ['slug'=>'grocery',     'label'=>'Grocery',        'description'=>'Rice, oils, spices and more',          'image'=>'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&q=80', 'sortOrder'=>40],
  ['slug'=>'cosmetics',   'label'=>'Cosmetics',      'description'=>'Skincare, makeup & beauty',            'image'=>'https://images.unsplash.com/photo-1522335789203-aaa2f6d4cdb1?w=600&q=80', 'sortOrder'=>50],
  ['slug'=>'garments',    'label'=>'Garments',       'description'=>'Clothing, fabrics & apparel',          'image'=>'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80', 'sortOrder'=>60],
  ['slug'=>'dry_fruits',  'label'=>'Dry Fruits',     'description'=>'Almonds, walnuts, apricots & more',    'image'=>'https://images.unsplash.com/photo-1604908554007-9354dca5d234?w=600&q=80', 'sortOrder'=>70],
  ['slug'=>'stationery',  'label'=>'Stationary',     'description'=>'Books, pens & school supplies',        'image'=>'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80', 'sortOrder'=>80],
  ['slug'=>'electronics', 'label'=>'Electronics',    'description'=>'Phones, accessories & gadgets',        'image'=>'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', 'sortOrder'=>90],
  ['slug'=>'fast_food',   'label'=>'Fast Food',      'description'=>'Burgers, pizza, broast & more',        'image'=>'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', 'sortOrder'=>100],
];

if (!file_exists($CATS_FILE)) {
  $seeded = [];
  foreach ($DEFAULTS as $d) {
    $d['id'] = bin2hex(random_bytes(8));
    $seeded[] = $d;
  }
  write_json($CATS_FILE, $seeded);
}

$cats = read_json($CATS_FILE, []);
$method = $_SERVER['REQUEST_METHOD'];
$body = read_body();
$action = $_GET['action'] ?? '';

function clean_slug(string $s): string {
  $s = strtolower(trim($s));
  $s = preg_replace('/[^a-z0-9_]+/', '_', $s);
  return trim($s, '_');
}

function normalize_cat(array $in, ?array $existing = null): ?array {
  $merged = $existing ? array_merge($existing, $in) : $in;
  $slug = clean_slug((string)($merged['slug'] ?? ''));
  $label = trim((string)($merged['label'] ?? ''));
  if ($slug === '' || $label === '') return null;
  return [
    'id'          => trim((string)($merged['id'] ?? bin2hex(random_bytes(8)))),
    'slug'        => $slug,
    'label'       => $label,
    'description' => trim((string)($merged['description'] ?? '')),
    'image'       => trim((string)($merged['image'] ?? '')),
    'sortOrder'   => (int)($merged['sortOrder'] ?? 999),
  ];
}

function sort_cats(array $cats): array {
  usort($cats, fn($a, $b) => ($a['sortOrder'] ?? 999) <=> ($b['sortOrder'] ?? 999));
  return array_values($cats);
}

if ($method === 'GET') {
  send(['categories' => sort_cats($cats)]);
}

if ($method === 'POST' && $action === 'reorder') {
  $ids = $body['ids'] ?? [];
  if (!is_array($ids)) send(['ok' => false, 'error' => 'invalid'], 400);
  $byId = [];
  foreach ($cats as $c) $byId[$c['id']] = $c;
  $next = [];
  $i = 0;
  foreach ($ids as $id) {
    if (isset($byId[$id])) {
      $byId[$id]['sortOrder'] = (++$i) * 10;
      $next[] = $byId[$id];
      unset($byId[$id]);
    }
  }
  // append any remaining (untouched) at the end
  foreach ($byId as $c) $next[] = $c;
  write_json($CATS_FILE, sort_cats($next));
  send(['ok' => true]);
}

if ($method === 'POST') {
  $cat = normalize_cat($body);
  if (!$cat) send(['ok' => false, 'error' => 'invalid'], 400);
  // Reject duplicate slugs
  foreach ($cats as $c) if (($c['slug'] ?? '') === $cat['slug']) send(['ok' => false, 'error' => 'duplicate slug'], 400);
  $cats[] = $cat;
  write_json($CATS_FILE, sort_cats($cats));
  send(['ok' => true, 'category' => $cat]);
}

if ($method === 'PATCH' || $method === 'PUT') {
  $id = trim((string)($body['id'] ?? ''));
  if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);
  foreach ($cats as &$c) {
    if (($c['id'] ?? '') === $id) {
      $next = normalize_cat($body, $c);
      if (!$next) send(['ok' => false, 'error' => 'invalid'], 400);
      $c = $next;
      write_json($CATS_FILE, sort_cats($cats));
      send(['ok' => true, 'category' => $next]);
    }
  }
  unset($c);
  send(['ok' => false, 'error' => 'not found'], 404);
}

if ($method === 'DELETE') {
  $id = trim((string)($_GET['id'] ?? ($body['id'] ?? '')));
  if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);
  $next = array_values(array_filter($cats, fn($c) => ($c['id'] ?? '') !== $id));
  if (count($next) === count($cats)) send(['ok' => false, 'error' => 'not found'], 404);
  write_json($CATS_FILE, $next);
  send(['ok' => true]);
}

send(['error' => 'method not allowed'], 405);
