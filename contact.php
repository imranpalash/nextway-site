<?php
/**
 * Nextway contact form handler.
 * Sends the enquiry to the office inbox. No database, no third-party service.
 * Spam protection: hidden honeypot field + per-IP rate limit + header-injection guards.
 */

const TO_EMAIL   = 'info@nextwayedu.com';
const FROM_EMAIL = 'no-reply@nextwayedu.com'; // must be an address on your own domain so mail is not flagged as spoofed
const RATE_LIMIT_SECONDS = 60;                // one submission per IP per minute

$wantsJson = (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);

function respond($ok, $message, $wantsJson)
{
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message]);
    } else {
        header('Location: /contact/' . ($ok ? '?sent=1' : '?error=1') . '#main');
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /contact/');
    exit;
}

// Honeypot: real visitors never fill this in. Pretend success so bots move on.
if (!empty($_POST['website'])) {
    respond(true, 'Thank you! We have received your message.', $wantsJson);
}

function clean($value, $max)
{
    $value = trim((string)$value);
    $value = preg_replace('/[\r\n]+/', ' ', $value);          // no header injection via single-line fields
    return mb_substr($value, 0, $max);
}

$name    = clean($_POST['name'] ?? '', 100);
$phone   = clean($_POST['phone'] ?? '', 30);
$email   = clean($_POST['email'] ?? '', 120);
$service = clean($_POST['service'] ?? '', 60);
$country = clean($_POST['country'] ?? '', 80);
$office  = clean($_POST['office'] ?? '', 40);
$message = mb_substr(trim((string)($_POST['message'] ?? '')), 0, 3000);
$consent = !empty($_POST['consent']);

if ($name === '' || $phone === '' || $message === '' || !$consent) {
    respond(false, 'Please fill in your name, phone number and message, and accept the privacy policy.', $wantsJson);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'That email address does not look right. Please check it or leave it blank.', $wantsJson);
}

// Rate limit per IP using a small file in the temp directory
$ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$lock = sys_get_temp_dir() . '/nextway_form_' . md5($ip);
if (is_file($lock) && (time() - filemtime($lock)) < RATE_LIMIT_SECONDS) {
    respond(false, 'Please wait a minute before sending another message.', $wantsJson);
}

$subject = 'Website enquiry: ' . ($service !== '' ? $service : 'General') . ' – ' . $name;
$body  = "New enquiry from nextwayedu.com\n\n";
$body .= "Name:     $name\n";
$body .= "Phone:    $phone\n";
$body .= "Email:    " . ($email !== '' ? $email : '(not given)') . "\n";
$body .= "Interest: $service\n";
$body .= "Country:  " . ($country !== '' ? $country : '(not given)') . "\n";
$body .= "Office:   " . ($office !== '' ? $office : '(not given)') . "\n\n";
$body .= "Message:\n$message\n\n";
$body .= "---\nSent from IP $ip at " . date('Y-m-d H:i:s T') . "\n";

$headers  = "From: Nextway Website <" . FROM_EMAIL . ">\r\n";
if ($email !== '') {
    $headers .= "Reply-To: $name <$email>\r\n";
}
$headers .= "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";

$sent = mail(TO_EMAIL, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);

if ($sent) {
    @touch($lock);
    respond(true, 'Thank you! We have received your message and will reply shortly.', $wantsJson);
}
respond(false, 'Sorry, we could not send your message just now. Please call or WhatsApp us on +880 1614 109215.', $wantsJson);
