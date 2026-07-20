<?php
declare(strict_types=1);

final class JsonBookingRepository implements BookingRepositoryInterface
{
    public function __construct(private readonly string $file)
    {
        $directory = dirname($this->file);
        if (!is_dir($directory) && !mkdir($directory, 0770, true) && !is_dir($directory)) {
            throw new RuntimeException('Speicherverzeichnis konnte nicht angelegt werden.');
        }
        if (!file_exists($this->file)) {
            file_put_contents($this->file, "[]\n", LOCK_EX);
        }
    }

    /** @return array<int, array<string, mixed>> */
    public function all(): array
    {
        $handle = fopen($this->file, 'c+');
        if ($handle === false) throw new RuntimeException('Speicher konnte nicht geöffnet werden.');
        try {
            if (!flock($handle, LOCK_SH)) throw new RuntimeException('Speicher konnte nicht gesperrt werden.');
            rewind($handle);
            $data = stream_get_contents($handle);
            $items = json_decode($data ?: '[]', true, 512, JSON_THROW_ON_ERROR);
            return is_array($items) ? $items : [];
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /** @param array<string, mixed> $booking */
    public function create(array $booking): array
    {
        return $this->mutate(function (array $items) use ($booking): array {
            $items[] = $booking;
            return [$items, $booking];
        });
    }

    /** @param array<string, mixed> $changes */
    public function update(string $id, array $changes): ?array
    {
        return $this->mutate(function (array $items) use ($id, $changes): array {
            $updated = null;
            foreach ($items as &$item) {
                if (($item['id'] ?? '') !== $id) continue;
                $item = array_merge($item, $changes, ['updatedAt' => date(DATE_ATOM)]);
                $updated = $item;
                break;
            }
            unset($item);
            return [$items, $updated];
        });
    }

    public function pruneClosed(int $retentionDays): int
    {
        return $this->mutate(function (array $items) use ($retentionDays): array {
            $threshold = time() - max(1, $retentionDays) * 86400;
            $closedStatuses = ['abgelehnt', 'storniert'];
            $kept = array_values(array_filter($items, function (array $item) use ($threshold, $closedStatuses): bool {
                if (!in_array($item['status'] ?? '', $closedStatuses, true)) return true;
                $updatedAt = strtotime((string) ($item['updatedAt'] ?? $item['createdAt'] ?? ''));
                return $updatedAt === false || $updatedAt >= $threshold;
            }));
            return [$kept, count($items) - count($kept)];
        });
    }

    private function mutate(callable $callback): mixed
    {
        $handle = fopen($this->file, 'c+');
        if ($handle === false) throw new RuntimeException('Speicher konnte nicht geöffnet werden.');
        try {
            if (!flock($handle, LOCK_EX)) throw new RuntimeException('Speicher konnte nicht gesperrt werden.');
            rewind($handle);
            $data = stream_get_contents($handle);
            $items = json_decode($data ?: '[]', true, 512, JSON_THROW_ON_ERROR);
            [$items, $result] = $callback(is_array($items) ? $items : []);
            rewind($handle);
            ftruncate($handle, 0);
            fwrite($handle, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n");
            fflush($handle);
            return $result;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
