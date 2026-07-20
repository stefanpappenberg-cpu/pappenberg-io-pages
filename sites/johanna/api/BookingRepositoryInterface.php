<?php
declare(strict_types=1);

interface BookingRepositoryInterface
{
    /** @return array<int, array<string, mixed>> */
    public function all(): array;

    /** @param array<string, mixed> $booking */
    public function create(array $booking): array;

    /** @param array<string, mixed> $changes */
    public function update(string $id, array $changes): ?array;

    public function pruneClosed(int $retentionDays): int;
}
