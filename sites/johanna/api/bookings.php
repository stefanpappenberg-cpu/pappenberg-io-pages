<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');

$config = require __DIR__ . '/config.php';
date_default_timezone_set($config['timezone']);
require __DIR__ . '/BookingRepositoryInterface.php';
require __DIR__ . '/JsonBookingRepository.php';

/** @var BookingRepositoryInterface $repository */
$repository = new JsonBookingRepository($config['storage_file']);
$repository->pruneClosed((int) $config['retention_days']);

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requireAdmin(array $config): void
{
    if ($config['admin_password'] === 'BITTE-VOR-LIVEGANG-AENDERN') {
        respond(503, ['success' => false, 'message' => 'Der Verwaltungszugang ist noch nicht konfiguriert.']);
    }
    $user = $_SERVER['PHP_AUTH_USER'] ?? '';
    $password = $_SERVER['PHP_AUTH_PW'] ?? '';
    if (!hash_equals((string) $config['admin_user'], $user) || !hash_equals((string) $config['admin_password'], $password)) {
        header('WWW-Authenticate: Basic realm="Studio Johanna Verwaltung", charset="UTF-8"');
        respond(401, ['success' => false, 'message' => 'Anmeldung erforderlich.']);
    }
}

function text(mixed $value, int $max = 250): string
{
    $value = trim((string) $value);
    return function_exists('mb_substr') ? mb_substr($value, 0, $max) : substr($value, 0, $max);
}

function textLength(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
}

function validDate(string $value): bool
{
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date !== false && $date->format('Y-m-d') === $value;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

try {
    if ($method === 'GET' && $action === 'availability') {
        $busyStatuses = ['option', 'bestaetigt'];
        $ranges = [];
        foreach ($repository->all() as $item) {
            if (!in_array($item['status'] ?? '', $busyStatuses, true)) continue;
            $ranges[] = [
                'date' => $item['date'] ?? '',
                'endDate' => $item['endDate'] ?? ($item['date'] ?? ''),
                'start' => $item['start'] ?? '',
                'duration' => $item['duration'] ?? 0,
                'status' => $item['status'],
            ];
        }
        respond(200, ['success' => true, 'ranges' => $ranges]);
    }

    if ($method === 'GET' && $action === 'list') {
        requireAdmin($config);
        $items = $repository->all();
        usort($items, fn(array $a, array $b): int => strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? '')));
        respond(200, ['success' => true, 'items' => $items]);
    }

    if ($method === 'PATCH') {
        requireAdmin($config);
        $input = json_decode(file_get_contents('php://input') ?: '{}', true, 512, JSON_THROW_ON_ERROR);
        $id = text($input['id'] ?? '', 80);
        $status = text($input['status'] ?? '', 30);
        $allowedStatuses = ['neu', 'in_pruefung', 'option', 'bestaetigt', 'abgelehnt', 'storniert'];
        if ($id === '' || !in_array($status, $allowedStatuses, true)) {
            respond(422, ['success' => false, 'message' => 'Ungültiger Status oder Datensatz.']);
        }
        $updated = $repository->update($id, [
            'status' => $status,
            'internalNote' => text($input['internalNote'] ?? '', 2000),
        ]);
        if ($updated === null) respond(404, ['success' => false, 'message' => 'Terminkarte nicht gefunden.']);
        respond(200, ['success' => true, 'item' => $updated]);
    }

    if ($method !== 'POST') respond(405, ['success' => false, 'message' => 'Methode nicht erlaubt.']);

    $input = json_decode(file_get_contents('php://input') ?: '{}', true, 512, JSON_THROW_ON_ERROR);
    if (text($input['company'] ?? '') !== '') respond(200, ['success' => true, 'reference' => 'SJ-OK']);

    $name = text($input['name'] ?? '', 120);
    $email = text($input['email'] ?? '', 190);
    $phone = text($input['phone'] ?? '', 60);
    $date = text($input['date'] ?? '', 10);
    $endDate = text($input['endDate'] ?? $date, 10);
    $type = text($input['type'] ?? '', 60);
    $guests = filter_var($input['guests'] ?? null, FILTER_VALIDATE_INT);
    $privacyAccepted = ($input['privacyAccepted'] ?? false) === true;

    $errors = [];
    if (textLength($name) < 2) $errors['name'] = 'Bitte geben Sie Ihren Namen an.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
    if (!validDate($date) || !validDate($endDate) || $endDate < $date) $errors['date'] = 'Bitte prüfen Sie den gewählten Termin.';
    if ($type === '') $errors['type'] = 'Bitte wählen Sie einen Anlass.';
    if ($guests === false || $guests < 1 || $guests > 80) $errors['guests'] = 'Die Personenzahl muss zwischen 1 und 80 liegen.';
    if (!$privacyAccepted) $errors['privacy'] = 'Die Datenschutzbestätigung fehlt.';
    if ($errors !== []) respond(422, ['success' => false, 'message' => 'Bitte prüfen Sie Ihre Angaben.', 'errors' => $errors]);

    $id = bin2hex(random_bytes(16));
    $reference = 'SJ-' . date('ymd') . '-' . strtoupper(substr($id, 0, 6));
    $booking = [
        'schemaVersion' => 1,
        'id' => $id,
        'reference' => $reference,
        'status' => 'neu',
        'createdAt' => date(DATE_ATOM),
        'updatedAt' => date(DATE_ATOM),
        'type' => $type,
        'typeLabel' => text($input['typeLabel'] ?? '', 120),
        'date' => $date,
        'endDate' => $endDate,
        'isMultiDay' => (bool) ($input['isMultiDay'] ?? false),
        'dayCount' => max(1, (int) ($input['dayCount'] ?? 1)),
        'start' => text($input['start'] ?? '', 5),
        'duration' => max(0, min(60, (int) ($input['duration'] ?? 0))),
        'guests' => (int) $guests,
        'seating' => text($input['seating'] ?? '', 120),
        'addons' => array_values(array_map(fn($value): string => text($value, 60), array_slice((array) ($input['addons'] ?? []), 0, 20))),
        'lodging' => text($input['lodging'] ?? '', 160),
        'priceNet' => max(0, (float) ($input['priceNet'] ?? 0)),
        'priceLabel' => text($input['priceLabel'] ?? '', 200),
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'notes' => text($input['notes'] ?? '', 1200),
        'privacyVersion' => text($input['privacyVersion'] ?? '', 20),
        'internalNote' => '',
    ];

    $repository->create($booking);
    respond(201, ['success' => true, 'reference' => $reference]);
} catch (JsonException) {
    respond(400, ['success' => false, 'message' => 'Ungültige Anfrage.']);
} catch (Throwable $error) {
    error_log($error->getMessage());
    respond(500, ['success' => false, 'message' => 'Die Anfrage konnte gerade nicht gespeichert werden.']);
}
