<?php
require __DIR__ . '/bootstrap.php';

$USERS_FILE = $DATA_DIR . '/users.json';
$VERIFY_FILE = $DATA_DIR . '/verifications.json';
if (!file_exists($USERS_FILE)) write_json($USERS_FILE, []);
if (!file_exists($VERIFY_FILE)) write_json($VERIFY_FILE, []);

$users = read_json($USERS_FILE, []);
$verifications = read_json($VERIFY_FILE, []);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$body = read_body();

function clean_email(string $s): string {
  return strtolower(trim($s));
}
function user_index_by_email(array $users, string $email): ?int {
  foreach ($users as $i => $u) if (clean_email((string)($u['email'] ?? '')) === clean_email($email)) return $i;
  return null;
}
function gen_user_id(): string { return 'u_' . bin2hex(random_bytes(8)); }
function gen_code(): string { return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT); }
function public_user(array $u): array {
  return [
    'id'            => $u['id'],
    'name'          => $u['name'] ?? $u['email'],
    'email'         => $u['email'],
    'phone'         => $u['phone'] ?? null,
    'address'       => $u['address'] ?? null,
    'emailVerified' => !empty($u['emailVerified']),
  ];
}

if ($method !== 'POST') send(['error' => 'method not allowed'], 405);

if ($action === 'signup') {
  $name = trim((string)($body['name'] ?? ''));
  $email = clean_email((string)($body['email'] ?? ''));
  $password = (string)($body['password'] ?? '');

  if (strlen($name) < 2) send(['ok' => false, 'msg' => 'Enter your full name'], 400);
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) send(['ok' => false, 'msg' => 'Enter a valid email'], 400);
  if (strlen($password) < 8) send(['ok' => false, 'msg' => 'Password must be at least 8 characters'], 400);

  if (user_index_by_email($users, $email) !== null) {
    send(['ok' => false, 'msg' => 'This email is already registered. Try logging in.'], 409);
  }

  $user = [
    'id'            => gen_user_id(),
    'name'          => $name,
    'email'         => $email,
    'phone'         => null,
    'address'       => null,
    'passwordHash'  => password_hash($password, PASSWORD_BCRYPT),
    'emailVerified' => false,
    'createdAt'     => gmdate('c'),
  ];
  $users[] = $user;
  write_json($USERS_FILE, $users);

  $code = gen_code();
  $verifications[$email] = [
    'codeHash'  => password_hash($code, PASSWORD_BCRYPT),
    'expiresAt' => time() + 15 * 60,
    'attempts'  => 0,
  ];
  write_json($VERIFY_FILE, $verifications);

  // Frontend receives the plaintext code briefly so it can hand it to
  // FormSubmit. Same pattern as the existing admin password reset flow.
  send(['ok' => true, 'code' => $code, 'msg' => 'Account created. Check your email for the 6-digit code.']);
}

if ($action === 'resend') {
  $email = clean_email((string)($body['email'] ?? ''));
  if (user_index_by_email($users, $email) === null) {
    send(['ok' => false, 'msg' => 'No account for that email'], 404);
  }
  $code = gen_code();
  $verifications[$email] = [
    'codeHash'  => password_hash($code, PASSWORD_BCRYPT),
    'expiresAt' => time() + 15 * 60,
    'attempts'  => 0,
  ];
  write_json($VERIFY_FILE, $verifications);
  send(['ok' => true, 'code' => $code]);
}

if ($action === 'verify') {
  $email = clean_email((string)($body['email'] ?? ''));
  $code = trim((string)($body['code'] ?? ''));
  $entry = $verifications[$email] ?? null;
  if (!$entry) send(['ok' => false, 'msg' => 'No code on file. Request a new one.'], 404);
  if (($entry['expiresAt'] ?? 0) < time()) send(['ok' => false, 'msg' => 'Code expired. Request a new one.'], 400);
  if (($entry['attempts'] ?? 0) >= 6) send(['ok' => false, 'msg' => 'Too many attempts. Request a new code.'], 429);
  if (!password_verify($code, $entry['codeHash'] ?? '')) {
    $verifications[$email]['attempts'] = ($entry['attempts'] ?? 0) + 1;
    write_json($VERIFY_FILE, $verifications);
    send(['ok' => false, 'msg' => 'Invalid code'], 400);
  }

  $i = user_index_by_email($users, $email);
  if ($i === null) send(['ok' => false, 'msg' => 'No account for that email'], 404);
  $users[$i]['emailVerified'] = true;
  write_json($USERS_FILE, $users);

  unset($verifications[$email]);
  write_json($VERIFY_FILE, $verifications);

  send(['ok' => true, 'user' => public_user($users[$i])]);
}

if ($action === 'login') {
  $email = clean_email((string)($body['email'] ?? ''));
  $password = (string)($body['password'] ?? '');

  $i = user_index_by_email($users, $email);
  if ($i === null) send(['ok' => false, 'msg' => 'Invalid email or password'], 401);
  $u = $users[$i];
  if (!password_verify($password, $u['passwordHash'] ?? '')) {
    send(['ok' => false, 'msg' => 'Invalid email or password'], 401);
  }
  if (empty($u['emailVerified'])) {
    send(['ok' => false, 'msg' => 'Email not verified yet. Check your inbox for the 6-digit code.', 'needsVerification' => true], 403);
  }
  send(['ok' => true, 'user' => public_user($u)]);
}

if ($action === 'updateProfile') {
  $id = trim((string)($body['id'] ?? ''));
  $email = clean_email((string)($body['email'] ?? ''));
  // Allow lookup by id OR email so existing localStorage sessions don't lock
  // out an in-flight profile update.
  $i = null;
  foreach ($users as $idx => $u) {
    if (($u['id'] ?? '') === $id || ($id === '' && clean_email((string)($u['email'] ?? '')) === $email)) {
      $i = $idx; break;
    }
  }
  if ($i === null) send(['ok' => false, 'msg' => 'User not found'], 404);

  if (isset($body['name']))    $users[$i]['name']    = trim((string)$body['name']);
  if (isset($body['phone']))   $users[$i]['phone']   = trim((string)$body['phone']) ?: null;
  if (isset($body['address'])) $users[$i]['address'] = trim((string)$body['address']) ?: null;
  write_json($USERS_FILE, $users);
  send(['ok' => true, 'user' => public_user($users[$i])]);
}

send(['ok' => false, 'error' => 'unknown action'], 400);
