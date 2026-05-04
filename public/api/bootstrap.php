<?php
// Shared header, JSON helpers, file storage. Required by every endpoint.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$DATA_DIR = __DIR__ . '/data';
if (!is_dir($DATA_DIR)) {
  @mkdir($DATA_DIR, 0755, true);
}

function read_json(string $path, $default = []) {
  if (!file_exists($path)) return $default;
  $raw = @file_get_contents($path);
  if ($raw === false || $raw === '') return $default;
  $decoded = json_decode($raw, true);
  return $decoded === null ? $default : $decoded;
}

function write_json(string $path, $data): bool {
  $tmp = $path . '.tmp';
  $fp = fopen($tmp, 'w');
  if (!$fp) return false;
  if (flock($fp, LOCK_EX)) {
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
  }
  fclose($fp);
  return rename($tmp, $path);
}

function read_body(): array {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $decoded = json_decode($raw, true);
  return is_array($decoded) ? $decoded : [];
}

function send($data, int $code = 200): void {
  http_response_code($code);
  echo json_encode($data);
  exit;
}
