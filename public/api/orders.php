<?php
require __DIR__ . '/bootstrap.php';

$ORDERS_FILE = $DATA_DIR . '/orders.json';
$orders = read_json($ORDERS_FILE, []);

$method = $_SERVER['REQUEST_METHOD'];
$body = read_body();

if ($method === 'GET') {
  send(['orders' => $orders]);
}

if ($method === 'POST') {
  $order = $body;
  if (empty($order['id']) || empty($order['userName']) || empty($order['phone'])) {
    send(['ok' => false, 'error' => 'invalid'], 400);
  }
  // Idempotent: skip if already saved.
  foreach ($orders as $o) {
    if (($o['id'] ?? '') === $order['id']) send(['ok' => true]);
  }
  array_unshift($orders, $order);
  write_json($ORDERS_FILE, $orders);
  send(['ok' => true]);
}

if ($method === 'PATCH' || $method === 'PUT') {
  $id = (string)($body['id'] ?? '');
  $status = (string)($body['status'] ?? '');
  $allowed = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  if ($id === '' || !in_array($status, $allowed, true)) send(['ok' => false], 400);

  $found = false;
  foreach ($orders as &$o) {
    if (($o['id'] ?? '') === $id) {
      $o['status'] = $status;
      $found = true;
      break;
    }
  }
  unset($o);
  if (!$found) send(['ok' => false], 404);
  write_json($ORDERS_FILE, $orders);
  send(['ok' => true]);
}

send(['error' => 'method not allowed'], 405);
