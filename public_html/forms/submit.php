<?php
/**
 * Elastrong Cares Foundation: single endpoint for all site forms.
 * Handles: contact, volunteer, partner, newsletter.
 * Returns JSON for AJAX requests; redirects back for plain HTML posts.
 */
declare(strict_types=1);

$config = require __DIR__ . '/config.php';
$storage = __DIR__ . '/storage';

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $message, int $code = 200): void
{
    global $wantsJson;
    http_response_code($code);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
    } else {
        $back = strtok($_SERVER['HTTP_REFERER'] ?? '/', '?');
        header('Location: ' . $back . '?sent=' . ($ok ? '1' : '0'));
    }
    exit;
}

function clean(?string $v, int $max = 2000): string
{
    $v = trim((string) $v);
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    $v = preg_replace('/[^\P{C}\n\t]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Method not allowed.', 405);
}

// Honeypot: real people never fill this hidden field
if (!empty($_POST['website'])) {
    respond(true, 'Thank you!');
}

// Timing check
$ts = (int) ($_POST['_ts'] ?? 0);
if ($ts > 0 && (time() - $ts) < $config['min_seconds_to_submit']) {
    respond(false, 'Please take a moment and try again.', 429);
}

// Rate limit per IP
if (!is_dir($storage)) {
    @mkdir($storage, 0750, true);
}
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = $storage . '/rate-' . md5($ip) . '.json';
$hits = is_file($rateFile) ? (json_decode((string) file_get_contents($rateFile), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn($t) => $t > time() - 3600));
if (count($hits) >= $config['max_per_ip_per_hour']) {
    respond(false, 'Too many submissions. Please try again later.', 429);
}
$hits[] = time();
@file_put_contents($rateFile, json_encode($hits), LOCK_EX);

// Form definitions: field => [label, required, maxLength]
$forms = [
    'contact' => [
        'subject' => 'New contact message',
        'fields'  => [
            'name'    => ['Name', true, 120],
            'email'   => ['Email', true, 160],
            'phone'   => ['Phone', false, 40],
            'subject' => ['Subject', false, 120],
            'message' => ['Message', true, 5000],
        ],
        'thanks' => 'Thank you! Your message has been sent.',
    ],
    'volunteer' => [
        'subject' => 'New volunteer sign-up',
        'fields'  => [
            'name'         => ['Name', true, 120],
            'email'        => ['Email', true, 160],
            'phone'        => ['Phone / WhatsApp', true, 40],
            'volunteer_type' => ['Volunteer type', false, 60],
            'location'     => ['Area of residence', false, 120],
            'availability' => ['Availability', false, 60],
            'skills'       => ['Interests', false, 500],
            'message'      => ['Notes', false, 3000],
        ],
        'thanks' => 'Welcome aboard! We will be in touch soon.',
    ],
    'partner' => [
        'subject' => 'New partnership enquiry',
        'fields'  => [
            'organization'     => ['Organisation', true, 160],
            'name'             => ['Contact person', true, 120],
            'email'            => ['Email', true, 160],
            'phone'            => ['Phone', false, 40],
            'partnership_type' => ['Partnership type', false, 120],
            'message'          => ['Message', false, 5000],
        ],
        'thanks' => 'Thank you! Our team will contact you shortly.',
    ],
    'newsletter' => [
        'subject' => 'New newsletter subscriber',
        'fields'  => ['email' => ['Email', true, 160]],
        'thanks'  => 'You are subscribed. Thank you!',
    ],
];

$type = $_POST['form_type'] ?? '';
if (!isset($forms[$type])) {
    respond(false, 'Unknown form.', 400);
}
$def = $forms[$type];

$data = [];
foreach ($def['fields'] as $key => [$label, $required, $max]) {
    $raw = $_POST[$key] ?? '';
    if (is_array($raw)) {
        $raw = implode(', ', array_map(fn($x) => clean((string) $x, 80), $raw));
    }
    $value = clean($raw, $max);
    if ($required && $value === '') {
        respond(false, "Please fill in: {$label}.", 422);
    }
    $data[$key] = $value;
}
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', 422);
}

// Build email
$lines = [];
foreach ($def['fields'] as $key => [$label]) {
    if ($data[$key] !== '') {
        $lines[] = str_pad($label . ':', 20) . $data[$key];
    }
}
$body = $def['subject'] . " via {$config['site_name']} website\n"
      . str_repeat('-', 48) . "\n"
      . implode("\n", $lines) . "\n"
      . str_repeat('-', 48) . "\n"
      . 'Sent: ' . date('D, d M Y H:i') . "\nIP: {$ip}\n";

$replyName = preg_replace('/[^\p{L}\p{N} .\'-]/u', '', $data['name'] ?? '') ?: 'Website visitor';
$headers = [
    'From: ' . $config['site_name'] . ' <' . $config['from'] . '>',
    'Reply-To: ' . $replyName . ' <' . $data['email'] . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . PHP_VERSION,
];
$subject = '=?UTF-8?B?' . base64_encode('[' . $config['site_name'] . '] ' . $def['subject']) . '?=';

$sent = @mail($config['to'], $subject, $body, implode("\r\n", $headers), '-f' . $config['from']);

// CSV backup (so nothing is lost even if email fails)
$stored = false;
if ($config['store_csv']) {
    $csv = $storage . '/' . $type . '.csv';
    $isNew = !is_file($csv);
    if ($fh = @fopen($csv, 'ab')) {
        flock($fh, LOCK_EX);
        if ($isNew) {
            fputcsv($fh, array_merge(['date'], array_keys($def['fields'])));
        }
        // Prefix formula-like values so the CSV is safe to open in Excel
        $row = array_map(fn($v) => preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v, array_values($data));
        fputcsv($fh, array_merge([date('Y-m-d H:i:s')], $row));
        flock($fh, LOCK_UN);
        fclose($fh);
        $stored = true;
    }
}

if (!$sent && !$stored) {
    respond(false, 'Sorry, something went wrong. Please email us directly.', 500);
}
respond(true, $def['thanks']);
