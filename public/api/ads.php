<?php
require __DIR__ . '/bootstrap.php';

$ADS_FILE = $DATA_DIR . '/ads.json';
if (!file_exists($ADS_FILE)) write_json($ADS_FILE, []);

$ads = read_json($ADS_FILE, []);
$method = $_SERVER['REQUEST_METHOD'];
$body = read_body();

$VALID_PLACEMENTS = ['home_banner','home_sidebar','category_page','sidebar'];

function normalize_ad(array $in, ?array $existing = null): ?array {
  global $VALID_PLACEMENTS;
  $merged = $existing ? array_merge($existing, $in) : $in;
  $title = trim((string)($merged['title'] ?? ''));
  $placement = (string)($merged['placement'] ?? 'home_banner');
  if ($title === '') return null;
  if (!in_array($placement, $VALID_PLACEMENTS, true)) return null;

  $expiresAt = $merged['expiresAt'] ?? null;
  if ($expiresAt === '') $expiresAt = null;

  return [
    'id'          => trim((string)($merged['id'] ?? bin2hex(random_bytes(8)))),
    'title'       => $title,
    'image'       => trim((string)($merged['image'] ?? '')),
    'link'        => trim((string)($merged['link'] ?? '')) ?: null,
    'placement'   => $placement,
    'category'    => trim((string)($merged['category'] ?? '')) ?: null,
    'vendorLabel' => trim((string)($merged['vendorLabel'] ?? '')) ?: null,
    'isActive'    => isset($merged['isActive']) ? (bool)$merged['isActive'] : true,
    'startsAt'    => trim((string)($merged['startsAt'] ?? gmdate('c'))),
    'expiresAt'   => $expiresAt ? trim((string)$expiresAt) : null,
    'sortOrder'   => (int)($merged['sortOrder'] ?? 0),
    'createdAt'   => trim((string)($merged['createdAt'] ?? gmdate('c'))),
  ];
}

function ad_active(array $a): bool {
  if (empty($a['isActive'])) return false;
  $now = time();
  if (!empty($a['startsAt']) && strtotime($a['startsAt']) > $now) return false;
  if (!empty($a['expiresAt']) && strtotime($a['expiresAt']) < $now) return false;
  return true;
}

if ($method === 'GET') {
  $placement = $_GET['placement'] ?? '';
  $category = $_GET['category'] ?? '';
  if ($placement !== '') {
    $filtered = array_values(array_filter($ads, function ($a) use ($placement, $category) {
      if (($a['placement'] ?? '') !== $placement) return false;
      if (!ad_active($a)) return false;
      if ($placement === 'category_page' && $category !== '' && ($a['category'] ?? '') !== $category) return false;
      return true;
    }));
    usort($filtered, fn($x, $y) => ($x['sortOrder'] ?? 0) <=> ($y['sortOrder'] ?? 0));
    send(['ads' => $filtered]);
  }
  // Newest first when admin lists everything
  usort($ads, fn($x, $y) => strcmp($y['createdAt'] ?? '', $x['createdAt'] ?? ''));
  send(['ads' => $ads]);
}

if ($method === 'POST') {
  $ad = normalize_ad($body);
  if (!$ad) send(['ok' => false, 'error' => 'invalid'], 400);
  array_unshift($ads, $ad);
  write_json($ADS_FILE, $ads);
  send(['ok' => true, 'ad' => $ad]);
}

if ($method === 'PATCH' || $method === 'PUT') {
  $id = trim((string)($body['id'] ?? ''));
  if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);
  foreach ($ads as &$a) {
    if (($a['id'] ?? '') === $id) {
      $next = normalize_ad($body, $a);
      if (!$next) send(['ok' => false, 'error' => 'invalid'], 400);
      $a = $next;
      write_json($ADS_FILE, $ads);
      send(['ok' => true, 'ad' => $next]);
    }
  }
  unset($a);
  send(['ok' => false, 'error' => 'not found'], 404);
}

if ($method === 'DELETE') {
  $id = trim((string)($_GET['id'] ?? ($body['id'] ?? '')));
  if ($id === '') send(['ok' => false, 'error' => 'missing id'], 400);
  $next = array_values(array_filter($ads, fn($a) => ($a['id'] ?? '') !== $id));
  if (count($next) === count($ads)) send(['ok' => false, 'error' => 'not found'], 404);
  write_json($ADS_FILE, $next);
  send(['ok' => true]);
}

send(['error' => 'method not allowed'], 405);
