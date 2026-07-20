<?php
declare(strict_types=1);

return [
    'storage_file' => dirname(__DIR__) . '/storage/bookings.json',
    'admin_user' => getenv('STUDIO_ADMIN_USER') ?: 'studio',
    // Vor dem Livegang zwingend als Umgebungsvariable setzen.
    'admin_password' => getenv('STUDIO_ADMIN_PASSWORD') ?: 'BITTE-VOR-LIVEGANG-AENDERN',
    'allowed_origins' => array_filter([
        getenv('STUDIO_PUBLIC_ORIGIN') ?: '',
    ]),
    'retention_days' => 365,
    'timezone' => 'Europe/Berlin',
];
