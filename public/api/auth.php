<?php
require __DIR__ . '/bootstrap.php';

$ADMIN_FILE = $DATA_DIR . '/admin.json';

$DEFAULT = [
  'email' => 'zahidali151272@gmail.com',
  'passwordHash' => hash('sha256', 'Zahid.313'),
];

if (!file_exists($ADMIN_FILE)) {
  write_json($ADMIN_FILE, $DEFAULT);
}
$admin = read_json($ADMIN_FILE, $DEFAULT);

$action = $_GET['action'] ?? '';
$body = read_body();

switch ($action) {
  case 'email':
    send(['email' => $admin['email']]);

  case 'verify': {
    $emailMatches = strtolower($body['email'] ?? '') === strtolower($admin['email']);
    $passMatches  = hash('sha256', (string)($body['password'] ?? '')) === $admin['passwordHash'];
    send(['ok' => $emailMatches && $passMatches]);
  }

  case 'updateEmail': {
    if (hash('sha256', (string)($body['currentPassword'] ?? '')) !== $admin['passwordHash']) {
      send(['ok' => false]);
    }
    $newEmail = trim((string)($body['newEmail'] ?? ''));
    if ($newEmail === '' || strpos($newEmail, '@') === false) send(['ok' => false]);
    $admin['email'] = $newEmail;
    write_json($ADMIN_FILE, $admin);
    send(['ok' => true]);
  }

  case 'updatePassword': {
    if (hash('sha256', (string)($body['currentPassword'] ?? '')) !== $admin['passwordHash']) {
      send(['ok' => false]);
    }
    $newPwd = (string)($body['newPassword'] ?? '');
    if (strlen($newPwd) < 4) send(['ok' => false]);
    $admin['passwordHash'] = hash('sha256', $newPwd);
    write_json($ADMIN_FILE, $admin);
    send(['ok' => true]);
  }

  case 'requestReset': {
    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $admin['resetCodeHash'] = hash('sha256', $code);
    $admin['resetExpires']  = time() + 15 * 60;
    write_json($ADMIN_FILE, $admin);
    send(['code' => $code]);
  }

  case 'consumeReset': {
    $codeOk = isset($admin['resetCodeHash'])
      && hash('sha256', trim((string)($body['code'] ?? ''))) === $admin['resetCodeHash']
      && (int)($admin['resetExpires'] ?? 0) > time();
    if (!$codeOk) send(['ok' => false]);
    $newPwd = (string)($body['newPassword'] ?? '');
    if (strlen($newPwd) < 4) send(['ok' => false]);
    $admin['passwordHash'] = hash('sha256', $newPwd);
    unset($admin['resetCodeHash'], $admin['resetExpires']);
    write_json($ADMIN_FILE, $admin);
    send(['ok' => true]);
  }

  default:
    send(['error' => 'unknown action'], 400);
}
